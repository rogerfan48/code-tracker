"use client";

import { cn } from "@/lib/utils";
import type { Level } from "@/types/tracker";
import { LEVEL_LABELS } from "./level-chip";
import s from "./level-picker.module.scss";

const LEVELS: Level[] = [0, 1, 2, 3];

export function LevelPicker({ value, onChange }: { value: Level | null; onChange: (level: Level) => void }) {
  return (
    <div className={s.group} role="radiogroup" aria-label="Familiarity level">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={value === level}
          className={cn(s.option, s[`level${level}`], value === level && s.selected)}
          onClick={() => onChange(level)}
        >
          <span className={s.digit}>{level}</span>
          <span className={s.label}>{LEVEL_LABELS[level]}</span>
        </button>
      ))}
    </div>
  );
}
