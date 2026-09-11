"use client";

import { useMemo } from "react";
import { useTracker } from "./tracker-provider";
import { formatLocalDate, isoWeekStart, parseLocalDate } from "@/lib/due";
import type { Difficulty, Level } from "@/types/tracker";
import { LEVEL_LABELS } from "./level-chip";
import s from "./stats-view.module.scss";

const WEEKS = 12;

export function StatsView() {
  const { data, dueMap, today } = useTracker();

  const stats = useMemo(() => {
    const byDifficulty: Record<Difficulty | "none", number> = { EASY: 0, MEDIUM: 0, HARD: 0, none: 0 };
    const byLevel: Record<Level | "new", number> = { 0: 0, 1: 0, 2: 0, 3: 0, new: 0 };
    let dueNow = 0;
    let records = 0;
    for (const p of data.problems) {
      byDifficulty[p.difficulty ?? "none"]++;
      const due = dueMap.get(p.id)!;
      if (due.last) byLevel[due.last.level]++;
      else byLevel.new++;
      if (due.status === "overdue" || due.status === "today") dueNow++;
      records += p.records.length;
    }
    const thisWeek = isoWeekStart(today);
    const weeks = Array.from({ length: WEEKS }, (_, i) => {
      const start = new Date(thisWeek);
      start.setDate(start.getDate() - (WEEKS - 1 - i) * 7);
      return { start, key: formatLocalDate(start), count: 0 };
    });
    const index = new Map(weeks.map((w, i) => [w.key, i]));
    for (const p of data.problems) {
      for (const r of p.records) {
        const key = formatLocalDate(isoWeekStart(parseLocalDate(r.date)));
        const i = index.get(key);
        if (i !== undefined) weeks[i].count++;
      }
    }
    return { byDifficulty, byLevel, dueNow, records, weeks, total: data.problems.length };
  }, [data.problems, dueMap, today]);

  const max = Math.max(1, ...stats.weeks.map((w) => w.count));

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Stats</h1>
      </header>

      <div className={s.tiles}>
        <Tile label="Problems" value={stats.total} />
        <Tile label="Practice records" value={stats.records} />
        <Tile label="Due now" value={stats.dueNow} tone={stats.dueNow ? "danger" : undefined} />
        <Tile label="Never practiced" value={stats.byLevel.new} tone="new" />
      </div>

      <div className={s.columns}>
        <section className={s.card}>
          <h2 className={s.cardTitle}>By difficulty</h2>
          <Bars
            rows={[
              { label: "Easy", value: stats.byDifficulty.EASY, color: "var(--diff-easy)" },
              { label: "Medium", value: stats.byDifficulty.MEDIUM, color: "var(--diff-medium)" },
              { label: "Hard", value: stats.byDifficulty.HARD, color: "var(--diff-hard)" },
              { label: "Not set", value: stats.byDifficulty.none, color: "var(--text-faint)" },
            ]}
          />
        </section>
        <section className={s.card}>
          <h2 className={s.cardTitle}>By last familiarity</h2>
          <Bars
            rows={[
              ...([0, 1, 2, 3] as Level[]).map((l) => ({ label: `${l} · ${LEVEL_LABELS[l]}`, value: stats.byLevel[l], color: `var(--level-${l})` })),
              { label: "New", value: stats.byLevel.new, color: "var(--due-new-fg)" },
            ]}
          />
        </section>
      </div>

      <section className={s.card}>
        <h2 className={s.cardTitle}>Practices per week · last {WEEKS} weeks</h2>
        <div className={s.chart} role="img" aria-label={`Practice records per week: ${stats.weeks.map((w) => `${w.key}: ${w.count}`).join(", ")}`}>
          {stats.weeks.map((w, i) => (
            <div key={w.key} className={s.col} title={`Week of ${w.key}: ${w.count}`}>
              <span className={s.value}>{w.count || ""}</span>
              <div className={s.bar} style={{ height: `${(w.count / max) * 100}%` }} data-current={i === WEEKS - 1 || undefined} />
              <span className={s.axis}>{w.start.getMonth() + 1}/{w.start.getDate()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: "danger" | "new" }) {
  return (
    <div className={s.tile} data-tone={tone}>
      <span className={s.tileValue}>{value}</span>
      <span className={s.tileLabel}>{label}</span>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className={s.bars}>
      {rows.map((r) => (
        <li key={r.label} className={s.barRow}>
          <span className={s.barLabel}>{r.label}</span>
          <span className={s.barTrack}>
            <span className={s.barFill} style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </span>
          <span className={s.barValue}>{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
