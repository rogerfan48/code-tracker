"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTracker } from "./tracker-provider";
import { useStoredValue } from "@/lib/hooks";
import { api } from "@/lib/client-api";
import { EMPTY_FILTERS, isFiltering, matchesFilters, type Filters } from "@/lib/filters";
import type { MainNode } from "@/lib/selectors";
import { Toolbar } from "./toolbar";
import { CategoryTree } from "./category-tree";
import { StructureEditor } from "./structure-editor";
import { PracticeDialog } from "./practice-dialog";
import { ProblemDialog, type ProblemDialogState } from "./problem-dialog";
import { Toc } from "./toc";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import s from "./problems-view.module.scss";

export function ProblemsView() {
  const { tree, data, dueMap, problemsById, categoriesById, mutate } = useTracker();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [collapsedList, setCollapsedList] = useStoredValue<string[]>("ct.collapsed", []);
  const [showTags, setShowTags] = useStoredValue<boolean>("ct.showTags", true);
  const collapsed = useMemo(() => new Set(collapsedList), [collapsedList]);
  const [editing, setEditing] = useState(false);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [problemDialog, setProblemDialog] = useState<ProblemDialogState>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [stickyTop, setStickyTop] = useState(112);

  // sticky sub-category headers and the TOC must clear the app header (52px) plus the toolbar
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const measure = () => setStickyTop(52 + el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filtering = isFiltering(filters);

  const visibleTree = useMemo<MainNode[]>(() => {
    if (!filtering) return tree;
    return tree
      .map((main) => ({
        category: main.category,
        subs: main.subs
          .map((sub) => ({ category: sub.category, problems: sub.problems.filter((p) => matchesFilters(p, dueMap.get(p.id)!, filters)) }))
          .filter((sub) => sub.problems.length > 0),
      }))
      .filter((main) => main.subs.length > 0);
  }, [tree, filtering, filters, dueMap]);

  const toggle = useCallback((id: string) => setCollapsedList((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])), [setCollapsedList]);
  const collapseAll = () => setCollapsedList(data.categories.filter((c) => !c.parentId).map((c) => c.id));
  const expandAll = () => setCollapsedList([]);

  // /problems?focus=<id>: reveal the row, flash it, then drop the param without a history entry.
  // State resets happen during render (React's "adjust state on prop change" pattern), DOM work in the effect.
  const focusParam = searchParams.get("focus");
  const [handledFocus, setHandledFocus] = useState<string | null>(null);
  if (focusParam && focusParam !== handledFocus) {
    setHandledFocus(focusParam);
    if (problemsById.has(focusParam)) {
      setFilters(EMPTY_FILTERS);
      setEditing(false);
      setFocusedId(focusParam);
    }
  }
  useEffect(() => {
    if (!focusParam) return;
    const problem = problemsById.get(focusParam);
    if (!problem) {
      router.replace("/problems", { scroll: false });
      return;
    }
    const sub = categoriesById.get(problem.categoryId);
    const reveal = [problem.categoryId, sub?.parentId].filter((x): x is string => Boolean(x));
    setCollapsedList((list) => list.filter((id) => !reveal.includes(id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusParam]);

  // Scroll once the focused row exists in the DOM (its category may have been collapsed a render ago)
  useEffect(() => {
    if (!focusParam || focusedId !== focusParam) return;
    const el = document.querySelector<HTMLElement>(`[data-problem-id="${CSS.escape(focusParam)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    router.replace("/problems", { scroll: false });
    const timer = setTimeout(() => setFocusedId(null), 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusParam, focusedId, collapsedList]);

  const deleting = deleteId ? problemsById.get(deleteId) : undefined;

  return (
    <div className={s.view}>
      <Toolbar
        ref={toolbarRef}
        filters={filters}
        onFilters={setFilters}
        tags={data.tags}
        onCollapseAll={collapseAll}
        onExpandAll={expandAll}
        editing={editing}
        onToggleEditing={() => setEditing((e) => !e)}
        onAdd={() => setProblemDialog({ mode: "create" })}
        showTags={showTags}
        onToggleTags={() => setShowTags((v) => !v)}
      />

      {editing ? (
        <StructureEditor />
      ) : tree.length === 0 ? (
        <EmptyState title="No categories yet" body="Use “Edit structure” to create your first main and sub categories, or seed the reference list." />
      ) : visibleTree.length === 0 ? (
        <EmptyState title="Nothing matches" body="Try a different search or clear the filters." />
      ) : (
        <div className={s.layout} style={{ "--sticky-top": `${stickyTop}px` } as React.CSSProperties}>
          <Toc tree={visibleTree} collapsed={collapsed} offset={stickyTop} onExpand={(ids) => setCollapsedList((list) => list.filter((id) => !ids.includes(id)))} />
          <div className={s.content}>
            {filtering ? <p className={s.filterHint}>Drag-and-drop is paused while filters are active.</p> : null}
            <CategoryTree
              tree={visibleTree}
              collapsed={collapsed}
              onToggle={toggle}
              dndEnabled={!filtering}
              showTags={showTags}
              focusedId={focusedId}
              onOpen={setPracticeId}
              onEdit={(id) => setProblemDialog({ mode: "edit", problemId: id })}
              onDelete={setDeleteId}
              onAddTo={(categoryId) => setProblemDialog({ mode: "create", categoryId })}
            />
          </div>
        </div>
      )}

      <PracticeDialog problemId={practiceId} onOpenChange={(o) => !o && setPracticeId(null)} />
      <ProblemDialog state={problemDialog} onOpenChange={(o) => !o && setProblemDialog(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={deleting ? `Delete “${deleting.title}”?` : ""}
        description={deleting ? `${deleting.records.length} practice record${deleting.records.length === 1 ? "" : "s"} will be deleted with it.` : undefined}
        onConfirm={async () => {
          if (!deleting) return;
          await mutate(() => api(`/api/problems/${deleting.id}`, { method: "DELETE" }), { success: "Problem deleted" });
        }}
      />
    </div>
  );
}
