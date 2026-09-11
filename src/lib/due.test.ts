import { describe, expect, it } from "vitest";
import { computeDue, daysSince, isoWeekStart, latestRecord, parseLocalDate } from "./due";
import type { ProblemDto, RecordDto } from "@/types/tracker";

const today = new Date(2026, 8, 11);
const settings = { intervals: [0, 90, 30, 14] as [number, number, number, number] };
const rec = (date: string, level: 0 | 1 | 2 | 3): RecordDto => ({ id: date, problemId: "p", date, level, note: null });
const problem = (records: RecordDto[]): ProblemDto => ({
  id: "p", categoryId: "c", source: "LEETCODE", number: "1", title: "t", difficulty: "EASY", url: null, position: 0, tagIds: [], records,
});

describe("due math", () => {
  it("parses dates as local calendar days", () => {
    expect(parseLocalDate("2026-09-11").getDate()).toBe(11);
    expect(daysSince("2026-09-01", today)).toBe(10);
  });

  it("marks never-practiced problems as new", () => {
    expect(computeDue(problem([]), settings, today)).toMatchObject({ status: "new", dueIn: null });
  });

  it("treats interval 0 as no re-practice", () => {
    expect(computeDue(problem([rec("2026-01-01", 0)]), settings, today).status).toBe("none");
  });

  it("classifies overdue / today / soon / ok", () => {
    expect(computeDue(problem([rec("2026-08-01", 3)]), settings, today)).toMatchObject({ status: "overdue", dueIn: -27 });
    expect(computeDue(problem([rec("2026-08-28", 3)]), settings, today)).toMatchObject({ status: "today", dueIn: 0 });
    expect(computeDue(problem([rec("2026-08-30", 3)]), settings, today)).toMatchObject({ status: "soon", dueIn: 2 });
    expect(computeDue(problem([rec("2026-09-10", 2)]), settings, today)).toMatchObject({ status: "ok", dueIn: 29 });
  });

  it("uses the newest record regardless of array order", () => {
    const p = problem([rec("2026-01-01", 3), rec("2026-09-10", 1)]);
    expect(latestRecord(p.records)?.date).toBe("2026-09-10");
    expect(computeDue(p, settings, today).status).toBe("ok");
  });

  it("finds Monday as ISO week start", () => {
    expect(isoWeekStart(new Date(2026, 8, 13)).getDate()).toBe(7);
    expect(isoWeekStart(new Date(2026, 8, 7)).getDate()).toBe(7);
  });
});
