"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTracker } from "./tracker-provider";
import { daysSince } from "@/lib/due";
import type { ProblemDto, RecordDto } from "@/types/tracker";
import { LevelChip } from "./level-chip";
import { DifficultyMark } from "./difficulty";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import s from "./list-views.module.scss";

const PAGE = 50;

function dayLabel(date: string, today: Date) {
  const diff = daysSince(date, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${date} · ${diff} days ago`;
}

export function RecentView() {
  const { data, problemsById, today } = useTracker();
  const [limit, setLimit] = useState(PAGE);

  const records = useMemo(() => {
    const all: (RecordDto & { problem: ProblemDto })[] = [];
    for (const p of data.problems) for (const r of p.records) all.push({ ...r, problem: p });
    all.sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1));
    return all;
  }, [data.problems]);

  const shown = records.slice(0, limit);
  const groups: { date: string; items: typeof shown }[] = [];
  for (const r of shown) {
    const last = groups[groups.length - 1];
    if (last && last.date === r.date) last.items.push(r);
    else groups.push({ date: r.date, items: [r] });
  }

  return (
    <div className={s.page}>
      <header className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Recent</h1>
          <p className={s.pageSub}>{records.length} practice record{records.length === 1 ? "" : "s"}. Click one to jump to the problem.</p>
        </div>
      </header>

      {records.length === 0 ? <EmptyState title="No practice yet" body="Click a problem row in the list to log your first session." /> : null}

      {groups.map((g) => (
        <section key={g.date} className={s.section}>
          <header className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>{dayLabel(g.date, today)}</h2>
            <span className={s.sectionCount}>{g.items.length}</span>
          </header>
          <div className={s.sectionBody}>
            {g.items.map((r) => (
              <Link key={r.id} href={`/problems?focus=${r.problem.id}`} className={s.recordRow} data-level={r.level}>
                <LevelChip level={r.level} />
                <span className={s.recordNumber}>{problemsById.get(r.problem.id)?.number ?? r.problem.number}</span>
                <span className={s.recordTitle}>{r.problem.title}</span>
                <DifficultyMark difficulty={r.problem.difficulty} />
                <span className={s.recordNote}>{r.note}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {records.length > limit ? (
        <Button onClick={() => setLimit((l) => l + PAGE)} className={s.loadMore}>
          Load more
        </Button>
      ) : null}
    </div>
  );
}
