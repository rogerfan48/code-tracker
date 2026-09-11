import { cn } from "@/lib/utils";
import type { TagColor } from "@/types/tracker";
import s from "./chips.module.scss";

export function TagChip({ name, color, onRemove, className }: { name: string; color: TagColor; onRemove?: () => void; className?: string }) {
  return (
    <span className={cn(s.tag, className)} data-color={color}>
      {name}
      {onRemove ? (
        <button type="button" className={s.tagRemove} onClick={onRemove} aria-label={`Remove tag ${name}`}>
          ×
        </button>
      ) : null}
    </span>
  );
}
