import { ExternalLink } from "lucide-react";
import { LevelChip } from "@/components/tracker/level-chip";
import { DueBadge } from "@/components/tracker/due-badge";
import { TagChip } from "@/components/tracker/tag-chip";
import { DifficultyMark } from "@/components/tracker/difficulty";
import type { DueInfo } from "@/lib/due";
import type { Difficulty, Level, TagColor } from "@/types/tracker";
import s from "./landing.module.scss";

interface Row {
  due: DueInfo;
  number: string;
  title: string;
  difficulty: Difficulty | null;
  tags: { name: string; color: TagColor }[];
  history: { level: Level; days: number }[];
}

const rec = (level: Level, days: number) => ({ level, days });
const due = (status: DueInfo["status"], dueIn: number | null = null): DueInfo => ({ status, dueIn, last: null });

const GROUPS: { main: string; sub: string; rows: Row[] }[] = [
  {
    main: "Array",
    sub: "Boyer-Moore Voting",
    rows: [
      { due: due("ok", 41), number: "169", title: "Majority Element", difficulty: "EASY", tags: [], history: [rec(1, 49), rec(2, 120)] },
      { due: due("overdue", -5), number: "229", title: "Majority Element II", difficulty: "MEDIUM", tags: [{ name: "Hash Table", color: "blue" }], history: [rec(3, 19), rec(3, 60)] },
    ],
  },
  {
    main: "Array",
    sub: "Prefix Sum & Difference Array",
    rows: [
      { due: due("today", 0), number: "560", title: "Subarray Sum Equals K", difficulty: "MEDIUM", tags: [{ name: "Hash Table", color: "blue" }], history: [rec(2, 30), rec(3, 71), rec(3, 95)] },
      { due: due("new"), number: "370", title: "Range Addition", difficulty: "MEDIUM", tags: [], history: [] },
      { due: due("none"), number: "238", title: "Product of Array Except Self", difficulty: "MEDIUM", tags: [{ name: "Two Pointers", color: "teal" }], history: [rec(0, 12), rec(1, 40)] },
    ],
  },
];

export function PreviewTable() {
  return (
    <div className={s.preview}>
      <div className={s.previewBar}>
        <span className={s.previewTitle}>Problems</span>
        <span className={s.previewHint}>days until re-practice · level · days since</span>
      </div>
      {GROUPS.map((g) => (
        <div key={g.sub}>
          <div className={s.previewSub}>
            <span className={s.previewMain}>{g.main}</span>
            <span>/</span>
            <span>{g.sub}</span>
          </div>
          {g.rows.map((r) => {
            const [last, ...rest] = r.history;
            return (
              <div key={r.number} className={s.previewRow} data-level={last?.level ?? ""}>
                <DueBadge due={r.due} />
                <span className={s.previewNumber}>{r.number}</span>
                <span className={s.previewTitleCell}>
                  <span>{r.title}</span>
                  {r.tags.length ? (
                    <span className={s.previewTags}>
                      {r.tags.map((t) => (
                        <TagChip key={t.name} name={t.name} color={t.color} />
                      ))}
                    </span>
                  ) : null}
                </span>
                <DifficultyMark difficulty={r.difficulty} />
                <span className={s.previewLast}>{last ? <LevelChip level={last.level} days={last.days} /> : <span className={s.previewEmpty}>–</span>}</span>
                <span className={s.previewHistory}>
                  {rest.map((h, i) => (
                    <LevelChip key={i} level={h.level} days={h.days} size="sm" />
                  ))}
                </span>
                <ExternalLink size={14} className={s.previewLink} aria-hidden />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
