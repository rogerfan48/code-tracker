import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types/tracker";
import s from "./chips.module.scss";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

export function DifficultyMark({ difficulty, className }: { difficulty: Difficulty | null; className?: string }) {
  if (!difficulty) return <span className={cn(s.diff, s.diffNone, className)} title="No difficulty">–</span>;
  return (
    <span className={cn(s.diff, s[`diff${difficulty}`], className)} title={DIFFICULTY_LABELS[difficulty]}>
      {difficulty[0]}
    </span>
  );
}
