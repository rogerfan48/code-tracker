"use client";

import { useMemo } from "react";
import { useTracker } from "./tracker-provider";
import { api } from "@/lib/client-api";
import { useStoredValue } from "@/lib/hooks";
import { categoryPath, problemTags } from "@/lib/selectors";
import type { ProblemDto } from "@/types/tracker";
import { ProblemRow } from "./problem-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import s from "./list-views.module.scss";

const WINDOWS = [3, 5, 7, 14, 30];

export function DueView() {
  const { data, dueMap, tagsById, categoriesById, today, mutate } = useTracker();
  const [showTags] = useStoredValue<boolean>("ct.showTags", true);
  const window = data.settings.soonDays;
  const setWindow = (days: number) => mutate(() => api("/api/settings", { method: "PUT", json: { ...data.settings, soonDays: days } }));

  const { now, upcoming, fresh } = useMemo(() => {
    const now: ProblemDto[] = [];
    const upcoming: ProblemDto[] = [];
    const fresh: ProblemDto[] = [];
    for (const p of data.problems) {
      const due = dueMap.get(p.id)!;
      if (due.status === "overdue" || due.status === "today") now.push(p);
      else if (due.status === "soon") upcoming.push(p);
      else if (due.status === "new") fresh.push(p);
    }
    const byDue = (a: ProblemDto, b: ProblemDto) => dueMap.get(a.id)!.dueIn! - dueMap.get(b.id)!.dueIn!;
    now.sort(byDue);
    upcoming.sort(byDue);
    fresh.sort((a, b) => a.position - b.position);
    return { now, upcoming, fresh };
  }, [data.problems, dueMap]);

  const render = (list: ProblemDto[]) =>
    list.map((p) => {
      const { main, sub } = categoryPath(p.categoryId, categoriesById);
      return (
        <ProblemRow
          key={p.id}
          problem={p}
          due={dueMap.get(p.id)!}
          tags={showTags ? problemTags(p, tagsById) : []}
          today={today}
          href={`/problems?focus=${p.id}`}
          breadcrumb={[main?.name, sub?.name].filter(Boolean).join(" / ")}
        />
      );
    });

  const empty = now.length + upcoming.length + fresh.length === 0;

  return (
    <div className={s.page}>
      <header className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Due</h1>
          <p className={s.pageSub}>Click a row to jump to it in the problem list.</p>
        </div>
      </header>

      {empty ? <EmptyState title="Nothing due" body="Everything is on schedule. Add problems or log practices to see them here." /> : null}

      {now.length ? (
        <Section title="Overdue & today" count={now.length}>
          {render(now)}
        </Section>
      ) : null}

      <Section
        title="Coming up"
        count={upcoming.length}
        aside={
          <Select value={String(window)} onValueChange={(v) => setWindow(Number(v))}>
            <SelectTrigger className={s.windowSelect} aria-label="Window in days">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([...WINDOWS, window])].sort((a, b) => a - b).map((w) => (
                <SelectItem key={w} value={String(w)}>
                  within {w} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        {upcoming.length ? render(upcoming) : <p className={s.sectionEmpty}>Nothing due in the next {window} days.</p>}
      </Section>

      {fresh.length ? (
        <Section title="Never practiced" count={fresh.length}>
          {render(fresh)}
        </Section>
      ) : null}
    </div>
  );
}

export function Section({ title, count, aside, children }: { title: string; count?: number; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={s.section}>
      <header className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>
          {title}
          {count !== undefined ? <span className={s.sectionCount}>{count}</span> : null}
        </h2>
        {aside}
      </header>
      <div className={s.sectionBody}>{children}</div>
    </section>
  );
}
