"use client";

import { ChevronsDownUp, ChevronsUpDown, Pencil, Plus, Search, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Filters } from "@/lib/filters";
import { isFiltering } from "@/lib/filters";
import type { DueStatus } from "@/lib/due";
import type { Difficulty, TagDto } from "@/types/tracker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import s from "./toolbar.module.scss";

const DIFFS: { value: Difficulty; label: string }[] = [
  { value: "EASY", label: "E" },
  { value: "MEDIUM", label: "M" },
  { value: "HARD", label: "H" },
];

const STATUSES: { value: DueStatus; label: string }[] = [
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "soon", label: "Soon" },
  { value: "ok", label: "OK" },
  { value: "none", label: "—" },
  { value: "new", label: "New" },
];

function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export interface ToolbarProps {
  filters: Filters;
  onFilters: (f: Filters) => void;
  tags: TagDto[];
  onCollapseAll: () => void;
  onExpandAll: () => void;
  editing: boolean;
  onToggleEditing: () => void;
  onAdd: () => void;
  showTags: boolean;
  onToggleTags: () => void;
}

export function Toolbar({ filters, onFilters, tags, onCollapseAll, onExpandAll, editing, onToggleEditing, onAdd, showTags, onToggleTags }: ToolbarProps) {
  const active = isFiltering(filters);
  return (
    <div className={s.bar}>
      <label className={s.search}>
        <Search size={15} aria-hidden />
        <input
          type="search"
          value={filters.query}
          placeholder="Search number or title"
          aria-label="Search problems"
          onChange={(e) => onFilters({ ...filters, query: e.target.value })}
        />
      </label>

      <div className={s.group} role="group" aria-label="Difficulty">
        {DIFFS.map((d) => (
          <button key={d.value} type="button" aria-pressed={filters.difficulties.includes(d.value)} className={cn(s.chip, s[`diff${d.value}`])} onClick={() => onFilters({ ...filters, difficulties: toggle(filters.difficulties, d.value) })}>
            {d.label}
          </button>
        ))}
      </div>

      <div className={s.group} role="group" aria-label="Status">
        {STATUSES.map((st) => (
          <button key={st.value} type="button" aria-pressed={filters.statuses.includes(st.value)} className={s.chip} onClick={() => onFilters({ ...filters, statuses: toggle(filters.statuses, st.value) })}>
            {st.label}
          </button>
        ))}
      </div>

      <Select value={filters.tagId ?? "all"} onValueChange={(v) => onFilters({ ...filters, tagId: v === "all" ? null : v })}>
        <SelectTrigger className={s.tagSelect} aria-label="Filter by tag">
          <SelectValue placeholder="Any tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any tag</SelectItem>
          {tags.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {active ? (
        <Button variant="ghost" size="sm" onClick={() => onFilters({ query: "", difficulties: [], tagId: null, statuses: [] })}>
          <X size={14} /> Clear
        </Button>
      ) : null}

      <div className={s.spacer} />

      <Button variant="ghost" size="icon" aria-label={showTags ? "Hide tags" : "Show tags"} title={showTags ? "Hide tags" : "Show tags"} aria-pressed={showTags} className={cn(showTags && s.toggled)} onClick={onToggleTags}>
        <Tag size={16} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Collapse all" title="Collapse all" onClick={onCollapseAll}>
        <ChevronsDownUp size={16} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Expand all" title="Expand all" onClick={onExpandAll}>
        <ChevronsUpDown size={16} />
      </Button>
      <Button variant={editing ? "primary" : "secondary"} onClick={onToggleEditing} aria-pressed={editing}>
        <Pencil size={14} /> {editing ? "Done" : "Edit structure"}
      </Button>
      <Button variant="primary" onClick={onAdd} disabled={editing}>
        <Plus size={16} /> Add problem
      </Button>
    </div>
  );
}
