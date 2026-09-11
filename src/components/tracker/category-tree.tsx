"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client-api";
import { problemTags, type MainNode, type SubNode } from "@/lib/selectors";
import type { Bootstrap, ProblemDto } from "@/types/tracker";
import { useTracker } from "./tracker-provider";
import { ProblemRow } from "./problem-row";
import { Button } from "@/components/ui/button";
import s from "./category-tree.module.scss";

export interface CategoryTreeProps {
  tree: MainNode[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  dndEnabled: boolean;
  showTags: boolean;
  focusedId: string | null;
  onOpen: (problemId: string) => void;
  onEdit: (problemId: string) => void;
  onDelete: (problemId: string) => void;
  onAddTo: (categoryId: string) => void;
}

const containerId = (categoryId: string) => `cat:${categoryId}`;

function reposition(problems: ProblemDto[], categoryId: string, orderedIds: string[]): ProblemDto[] {
  const index = new Map(orderedIds.map((id, i) => [id, i]));
  return problems.map((p) => (index.has(p.id) ? { ...p, categoryId, position: index.get(p.id)! } : p));
}

export function CategoryTree({ tree, collapsed, onToggle, dndEnabled, showTags, focusedId, onOpen, onEdit, onDelete, onAddTo }: CategoryTreeProps) {
  const { data, problemsById, setData, reload } = useTracker();
  const [activeId, setActiveId] = useState<string | null>(null);
  const snapshot = useRef<Bootstrap | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const orderedIdsOf = useCallback(
    (problems: ProblemDto[], categoryId: string) =>
      problems.filter((p) => p.categoryId === categoryId).sort((a, b) => a.position - b.position).map((p) => p.id),
    [],
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    snapshot.current = data;
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    const moving = problemsById.get(activeKey);
    if (!moving) return;
    const overCategory = overKey.startsWith("cat:") ? overKey.slice(4) : problemsById.get(overKey)?.categoryId;
    if (!overCategory || overCategory === moving.categoryId) return;
    const dest = orderedIdsOf(data.problems, overCategory);
    const overIndex = dest.indexOf(overKey);
    dest.splice(overIndex >= 0 ? overIndex : dest.length, 0, activeKey);
    setData({ ...data, problems: reposition(data.problems, overCategory, dest) });
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const before = snapshot.current;
    snapshot.current = null;
    if (!over) {
      if (before) setData(before);
      return;
    }
    const activeKey = String(active.id);
    const overKey = String(over.id);
    const moving = problemsById.get(activeKey);
    if (!moving) return;
    const ids = orderedIdsOf(data.problems, moving.categoryId);
    const from = ids.indexOf(activeKey);
    const to = ids.indexOf(overKey);
    const orderedIds = from >= 0 && to >= 0 && from !== to ? arrayMove(ids, from, to) : ids;
    setData({ ...data, problems: reposition(data.problems, moving.categoryId, orderedIds) });
    try {
      await api("/api/problems/reorder", { method: "PUT", json: { categoryId: moving.categoryId, orderedIds } });
      await reload();
    } catch (err) {
      if (before) setData(before);
      toast.error(err instanceof Error ? err.message : "Could not save the new order");
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
    if (snapshot.current) setData(snapshot.current);
    snapshot.current = null;
  };

  const activeProblem = activeId ? problemsById.get(activeId) : undefined;

  const content = tree.map((main) => (
    <MainSection key={main.category.id} node={main} collapsed={collapsed} onToggle={onToggle} onAddTo={onAddTo}>
      {main.subs.map((sub) => (
        <SubSection
          key={sub.category.id}
          node={sub}
          collapsed={collapsed.has(sub.category.id)}
          onToggle={() => onToggle(sub.category.id)}
          onAddTo={() => onAddTo(sub.category.id)}
          dndEnabled={dndEnabled}
          showTags={showTags}
          focusedId={focusedId}
          activeId={activeId}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </MainSection>
  ));

  if (!dndEnabled) return <div className={s.tree}>{content}</div>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
      <div className={s.tree}>{content}</div>
      <DragOverlay dropAnimation={null}>{activeProblem ? <OverlayRow problem={activeProblem} /> : null}</DragOverlay>
    </DndContext>
  );
}

function MainSection({ node, collapsed, onToggle, children }: { node: MainNode; collapsed: Set<string>; onToggle: (id: string) => void; onAddTo: (id: string) => void; children: React.ReactNode }) {
  const { dueMap } = useTracker();
  const isCollapsed = collapsed.has(node.category.id);
  const problems = node.subs.flatMap((sub) => sub.problems);
  const dueCount = problems.filter((p) => ["overdue", "today"].includes(dueMap.get(p.id)?.status ?? "")).length;
  return (
    <section className={s.main} aria-labelledby={`main-${node.category.id}`} data-category-id={node.category.id}>
      <button type="button" className={s.mainHeader} onClick={() => onToggle(node.category.id)} aria-expanded={!isCollapsed}>
        <ChevronRight size={16} className={cn(s.chevron, !isCollapsed && s.chevronOpen)} aria-hidden />
        <h2 id={`main-${node.category.id}`} className={s.mainTitle}>{node.category.name}</h2>
        <span className={s.count}>{problems.length}</span>
        {dueCount ? <span className={s.dueCount}>{dueCount} due</span> : null}
      </button>
      {!isCollapsed ? <div className={s.mainBody}>{children}</div> : null}
    </section>
  );
}

function SubSection({ node, collapsed, onToggle, onAddTo, dndEnabled, showTags, focusedId, activeId, onOpen, onEdit, onDelete }: {
  node: SubNode;
  collapsed: boolean;
  onToggle: () => void;
  onAddTo: () => void;
  dndEnabled: boolean;
  showTags: boolean;
  focusedId: string | null;
  activeId: string | null;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { dueMap } = useTracker();
  const ids = useMemo(() => node.problems.map((p) => p.id), [node.problems]);
  const dueCount = node.problems.filter((p) => ["overdue", "today"].includes(dueMap.get(p.id)?.status ?? "")).length;
  const { setNodeRef, isOver } = useDroppable({ id: containerId(node.category.id), disabled: !dndEnabled || collapsed });

  const rows = node.problems.map((p) => (
    <SortableRow key={p.id} problem={p} dndEnabled={dndEnabled} showTags={showTags} focused={focusedId === p.id} dragging={activeId === p.id} onOpen={() => onOpen(p.id)} onEdit={() => onEdit(p.id)} onDelete={() => onDelete(p.id)} />
  ));

  return (
    <div className={s.sub} data-category-id={node.category.id}>
      <div className={s.subHeader}>
        <button type="button" className={s.subToggle} onClick={onToggle} aria-expanded={!collapsed}>
          <ChevronRight size={14} className={cn(s.chevron, !collapsed && s.chevronOpen)} aria-hidden />
          <h3 className={s.subTitle}>{node.category.name}</h3>
          <span className={s.count}>{node.problems.length}</span>
          {dueCount ? <span className={s.dueCount}>{dueCount} due</span> : null}
        </button>
        <Button variant="ghost" size="iconSm" className={s.addBtn} aria-label={`Add problem to ${node.category.name}`} onClick={onAddTo}>
          <Plus size={14} />
        </Button>
      </div>
      {!collapsed ? (
        <div ref={setNodeRef} className={cn(s.list, isOver && s.listOver, node.problems.length === 0 && s.listEmpty)}>
          {dndEnabled ? (
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {rows}
            </SortableContext>
          ) : (
            rows
          )}
          {node.problems.length === 0 ? <p className={s.emptyList}>No problems yet — drop one here or use +.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function SortableRow({ problem, dndEnabled, showTags, focused, dragging, onOpen, onEdit, onDelete }: { problem: ProblemDto; dndEnabled: boolean; showTags: boolean; focused: boolean; dragging: boolean; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const { dueMap, tagsById, today } = useTracker();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({ id: problem.id, disabled: !dndEnabled });
  const due = dueMap.get(problem.id)!;
  return (
    <ProblemRow
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      problem={problem}
      due={due}
      tags={showTags ? problemTags(problem, tagsById) : []}
      today={today}
      focused={focused}
      dragging={dragging}
      dragHandleProps={dndEnabled ? { ref: setActivatorNodeRef, ...attributes, ...listeners } : undefined}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

function OverlayRow({ problem }: { problem: ProblemDto }) {
  const { dueMap, tagsById, today } = useTracker();
  return (
    <div className={s.overlay}>
      <ProblemRow problem={problem} due={dueMap.get(problem.id)!} tags={problemTags(problem, tagsById)} today={today} />
    </div>
  );
}
