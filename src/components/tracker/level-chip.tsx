import { cn } from "@/lib/utils";
import type { Level } from "@/types/tracker";
import s from "./chips.module.scss";

export const LEVEL_LABELS: Record<Level, string> = { 0: "Easy for me", 1: "Average", 2: "Hard", 3: "Very hard" };

export function LevelChip({ level, days, size = "md", className }: { level: Level; days?: number; size?: "md" | "sm"; className?: string }) {
  return (
    <span className={cn(s.level, s[`level${level}`], size === "sm" && s.levelSm, className)}>
      <span className={s.levelDot}>{level}</span>
      {days !== undefined ? <span className={s.levelDays}>{days}</span> : null}
    </span>
  );
}
