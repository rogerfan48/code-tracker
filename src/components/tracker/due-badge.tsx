import { cn } from "@/lib/utils";
import type { DueInfo } from "@/lib/due";
import s from "./chips.module.scss";

export function dueLabel(due: DueInfo) {
  switch (due.status) {
    case "new":
      return "new";
    case "none":
      return "—";
    default:
      return String(due.dueIn);
  }
}

export function dueTitle(due: DueInfo) {
  switch (due.status) {
    case "new":
      return "Never practiced";
    case "none":
      return "No re-practice needed";
    case "overdue":
      return `${-due.dueIn!} days overdue`;
    case "today":
      return "Due today";
    default:
      return `Due in ${due.dueIn} days`;
  }
}

export function DueBadge({ due, className }: { due: DueInfo; className?: string }) {
  return (
    <span className={cn(s.due, s[`due-${due.status}`], className)} title={dueTitle(due)}>
      {dueLabel(due)}
    </span>
  );
}
