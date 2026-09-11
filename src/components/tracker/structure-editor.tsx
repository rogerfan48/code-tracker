"use client";

import { useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client-api";
import type { MainNode, SubNode } from "@/lib/selectors";
import type { CategoryDto } from "@/types/tracker";
import { useTracker } from "./tracker-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip } from "@/components/ui/tooltip";
import s from "./structure-editor.module.scss";

type DragData = { kind: "main" } | { kind: "sub"; parentId: string };

export function StructureEditor() {
  const { tree, data, setData, reload, mutate } = useTracker();
  const [deleting, setDeleting] = useState<CategoryDto | null>(null);
  const [addingMain, setAddingMain] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const a = active.data.current as DragData | undefined;
    const o = over.data.current as DragData | undefined;
    if (!a || !o || a.kind !== o.kind) return;
    const parentId = a.kind === "sub" ? a.parentId : null;
    if (a.kind === "sub" && o.kind === "sub" && o.parentId !== parentId) return;
    const siblings = data.categories.filter((c) => c.parentId === parentId).sort((x, y) => x.position - y.position).map((c) => c.id);
    const from = siblings.indexOf(String(active.id));
    const to = siblings.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const orderedIds = arrayMove(siblings, from, to);
    const index = new Map(orderedIds.map((id, i) => [id, i]));
    const before = data;
    setData({ ...data, categories: data.categories.map((c) => (index.has(c.id) ? { ...c, position: index.get(c.id)! } : c)) });
    try {
      await api("/api/categories/reorder", { method: "PUT", json: { parentId, orderedIds } });
      await reload();
    } catch (err) {
      setData(before);
      const { toast } = await import("sonner");
      toast.error(err instanceof Error ? err.message : "Could not reorder");
    }
  };

  const createCategory = (name: string, parentId: string | null) =>
    mutate(() => api("/api/categories", { method: "POST", json: { name, parentId } }), { success: parentId ? "Sub category added" : "Main category added" });

  const rename = (id: string, name: string) => mutate(() => api(`/api/categories/${id}`, { method: "PATCH", json: { name } }));

  const problemCount = (node: SubNode) => node.problems.length;

  return (
    <div className={s.editor}>
      <p className={s.hint}>Drag to reorder categories, click a name to rename. Categories can be deleted once they are empty.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={tree.map((m) => m.category.id)} strategy={verticalListSortingStrategy}>
          <div className={s.mains}>
            {tree.map((main) => (
              <MainItem key={main.category.id} node={main} onRename={rename} onDelete={setDeleting} onCreateSub={(name) => createCategory(name, main.category.id)} problemCount={problemCount} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {addingMain ? (
        <InlineForm placeholder="New main category" onCancel={() => setAddingMain(false)} onSubmit={async (name) => { await createCategory(name, null); setAddingMain(false); }} />
      ) : (
        <Button onClick={() => setAddingMain(true)}>
          <Plus size={14} /> Main category
        </Button>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="This only removes the empty category."
        onConfirm={async () => {
          if (!deleting) return;
          await mutate(() => api(`/api/categories/${deleting.id}`, { method: "DELETE" }), { success: "Category deleted" });
        }}
      />
    </div>
  );
}

function MainItem({ node, onRename, onDelete, onCreateSub, problemCount }: { node: MainNode; onRename: (id: string, name: string) => Promise<unknown>; onDelete: (c: CategoryDto) => void; onCreateSub: (name: string) => Promise<unknown>; problemCount: (n: SubNode) => number }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: node.category.id, data: { kind: "main" } satisfies DragData });
  const [addingSub, setAddingSub] = useState(false);
  const total = node.subs.reduce((n, sub) => n + problemCount(sub), 0);
  const deletable = node.subs.length === 0;
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn(s.main, isDragging && s.dragging)}>
      <div className={s.row}>
        <button type="button" ref={setActivatorNodeRef} className={s.handle} aria-label={`Reorder ${node.category.name}`} {...attributes} {...listeners}>
          <GripVertical size={16} />
        </button>
        <EditableName name={node.category.name} className={s.mainName} onSave={(n) => onRename(node.category.id, n)} />
        <span className={s.meta}>{node.subs.length} sub · {total} problems</span>
        <DeleteButton disabled={!deletable} reason="Delete its sub categories first" onClick={() => onDelete(node.category)} />
      </div>
      <SortableContext items={node.subs.map((sub) => sub.category.id)} strategy={verticalListSortingStrategy}>
        <div className={s.subs}>
          {node.subs.map((sub) => (
            <SubItem key={sub.category.id} node={sub} parentId={node.category.id} onRename={onRename} onDelete={onDelete} />
          ))}
          {addingSub ? (
            <InlineForm placeholder="New sub category" onCancel={() => setAddingSub(false)} onSubmit={async (name) => { await onCreateSub(name); setAddingSub(false); }} className={s.subForm} />
          ) : (
            <button type="button" className={s.addSub} onClick={() => setAddingSub(true)}>
              <Plus size={13} /> Sub category
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SubItem({ node, parentId, onRename, onDelete }: { node: SubNode; parentId: string; onRename: (id: string, name: string) => Promise<unknown>; onDelete: (c: CategoryDto) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: node.category.id, data: { kind: "sub", parentId } satisfies DragData });
  const count = node.problems.length;
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn(s.row, s.subRow, isDragging && s.dragging)}>
      <button type="button" ref={setActivatorNodeRef} className={s.handle} aria-label={`Reorder ${node.category.name}`} {...attributes} {...listeners}>
        <GripVertical size={14} />
      </button>
      <EditableName name={node.category.name} className={s.subName} onSave={(n) => onRename(node.category.id, n)} />
      <span className={s.meta}>{count} problems</span>
      <DeleteButton disabled={count > 0} reason="Move or delete its problems first" onClick={() => onDelete(node.category)} />
    </div>
  );
}

function DeleteButton({ disabled, reason, onClick }: { disabled: boolean; reason: string; onClick: () => void }) {
  const btn = (
    <Button variant="ghost" size="iconSm" aria-label="Delete category" disabled={disabled} onClick={onClick} className={s.deleteBtn}>
      <Trash2 size={14} />
    </Button>
  );
  if (!disabled) return btn;
  return (
    <Tooltip content={reason}>
      <span className={s.disabledWrap}>{btn}</span>
    </Tooltip>
  );
}

function EditableName({ name, onSave, className }: { name: string; onSave: (name: string) => Promise<unknown>; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);

  const commit = async () => {
    const next = value.trim();
    if (!next || next === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    setBusy(true);
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      setValue(name);
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <button type="button" className={cn(s.name, className)} onClick={() => { setValue(name); setEditing(true); }} aria-label={`Rename ${name}`}>
        {name}
        <Pencil size={12} className={s.namePencil} aria-hidden />
      </button>
    );
  }
  return (
    <span className={s.nameEdit}>
      <Input
        value={value}
        autoFocus
        maxLength={80}
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setEditing(false); setValue(name); }
        }}
        onBlur={commit}
        aria-label="Category name"
      />
    </span>
  );
}

function InlineForm({ placeholder, onSubmit, onCancel, className }: { placeholder: string; onSubmit: (name: string) => Promise<void>; onCancel: () => void; className?: string }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    setBusy(true);
    try {
      await onSubmit(name);
    } catch {
      /* toasted */
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className={cn(s.inlineForm, className)}>
      <Input value={value} placeholder={placeholder} autoFocus maxLength={80} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onCancel()} aria-label={placeholder} />
      <Button type="submit" size="icon" variant="primary" aria-label="Add" loading={busy}>
        <Check size={14} />
      </Button>
      <Button type="button" size="icon" variant="ghost" aria-label="Cancel" onClick={onCancel} disabled={busy}>
        <X size={14} />
      </Button>
    </form>
  );
}
