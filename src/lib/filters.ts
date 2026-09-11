import type { DueInfo, DueStatus } from "./due";
import type { Difficulty, ProblemDto } from "@/types/tracker";

export interface Filters {
  query: string;
  difficulties: Difficulty[];
  tagId: string | null;
  statuses: DueStatus[];
}

export const EMPTY_FILTERS: Filters = { query: "", difficulties: [], tagId: null, statuses: [] };

export function isFiltering(f: Filters) {
  return Boolean(f.query.trim()) || f.difficulties.length > 0 || f.tagId !== null || f.statuses.length > 0;
}

export function matchesFilters(problem: ProblemDto, due: DueInfo, f: Filters) {
  const q = f.query.trim().toLowerCase();
  if (q && !problem.number.toLowerCase().includes(q) && !problem.title.toLowerCase().includes(q)) return false;
  if (f.difficulties.length && (!problem.difficulty || !f.difficulties.includes(problem.difficulty))) return false;
  if (f.tagId && !problem.tagIds.includes(f.tagId)) return false;
  if (f.statuses.length && !f.statuses.includes(due.status)) return false;
  return true;
}
