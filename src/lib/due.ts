import type { ProblemDto, RecordDto, SettingsDto } from "@/types/tracker";

export type DueStatus = "new" | "none" | "overdue" | "today" | "soon" | "ok";

export interface DueInfo {
  status: DueStatus;
  dueIn: number | null;
  last: RecordDto | null;
}

const DAY_MS = 86_400_000;

export function todayLocal(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseLocalDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysBetween(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function daysSince(dateStr: string, today: Date) {
  return daysBetween(parseLocalDate(dateStr), today);
}

export function latestRecord(records: RecordDto[]): RecordDto | null {
  return records.reduce<RecordDto | null>((best, r) => {
    if (!best || r.date > best.date) return r;
    return best;
  }, null);
}

export function computeDue(problem: ProblemDto, settings: SettingsDto, today: Date): DueInfo {
  const last = latestRecord(problem.records);
  if (!last) return { status: "new", dueIn: null, last: null };
  const interval = settings.intervals[last.level];
  if (!interval || interval <= 0) return { status: "none", dueIn: null, last };
  const dueIn = interval - daysSince(last.date, today);
  const status: DueStatus = dueIn < 0 ? "overdue" : dueIn === 0 ? "today" : dueIn <= 3 ? "soon" : "ok";
  return { status, dueIn, last };
}

export function isoWeekStart(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}
