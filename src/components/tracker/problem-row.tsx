"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { daysSince, type DueInfo } from "@/lib/due";
import type { ProblemDto, TagDto } from "@/types/tracker";
import { LevelChip, LEVEL_LABELS } from "./level-chip";
import { DueBadge } from "./due-badge";
import { TagChip } from "./tag-chip";
import { DifficultyMark } from "./difficulty";
import { Tooltip } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import s from "./problem-row.module.scss";

export interface ProblemRowProps {
  problem: ProblemDto;
  due: DueInfo;
  tags: TagDto[];
  today: Date;
  /** Link rows navigate to the main view instead of opening dialogs. */
  href?: string;
  breadcrumb?: string;
  focused?: boolean;
  dimmed?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> };
  dragging?: boolean;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

function recordTooltip(date: string, level: number, note: string | null) {
  return (
    <span>
      {date} · level {level} ({LEVEL_LABELS[level as 0 | 1 | 2 | 3]})
      {note ? <><br />{note}</> : null}
    </span>
  );
}

export const ProblemRow = forwardRef<HTMLDivElement, ProblemRowProps>(function ProblemRow(
  { problem, due, tags, today, href, breadcrumb, focused, dimmed, dragHandleProps, dragging, onOpen, onEdit, onDelete, style, className },
  ref,
) {
  const [last, ...rest] = problem.records;
  const level = last?.level ?? null;
  const interactive = Boolean(onOpen) && !href;

  const body = (
    <>
      {dragHandleProps ? (
        <button type="button" className={s.handle} aria-label={`Reorder ${problem.title}`} {...dragHandleProps} />
      ) : (
        <span className={s.handleSpacer} />
      )}
      <DueBadge due={due} className={s.due} />
      <span className={s.number} title={problem.number}>{problem.number}</span>
      <span className={s.titleCell}>
        <span className={s.title} title={problem.title}>{problem.title}</span>
        {breadcrumb ? <span className={s.crumb}>{breadcrumb}</span> : null}
        {tags.length ? (
          <span className={s.tags}>
            {tags.map((t) => (
              <TagChip key={t.id} name={t.name} color={t.color} />
            ))}
          </span>
        ) : null}
      </span>
      <DifficultyMark difficulty={problem.difficulty} className={s.diff} />
      <span className={s.last}>
        {last ? (
          <Tooltip content={recordTooltip(last.date, last.level, last.note)}>
            <span className={s.chipWrap}>
              <LevelChip level={last.level} days={daysSince(last.date, today)} />
            </span>
          </Tooltip>
        ) : (
          <span className={s.empty}>–</span>
        )}
      </span>
      <span className={s.history}>
        {rest.map((r) => (
          <Tooltip key={r.id} content={recordTooltip(r.date, r.level, r.note)}>
            <span className={s.chipWrap}>
              <LevelChip level={r.level} days={daysSince(r.date, today)} size="sm" />
            </span>
          </Tooltip>
        ))}
      </span>
      <span className={s.actions}>
        {problem.url ? (
          <a
            href={problem.url}
            target="_blank"
            rel="noreferrer"
            className={s.iconBtn}
            aria-label={`Open ${problem.title} in a new tab`}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className={s.iconSpacer} />
        )}
        {interactive && (onEdit || onDelete) ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={s.iconBtn} aria-label={`More actions for ${problem.title}`} onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {onEdit ? (
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil size={14} /> Edit problem
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 size={14} /> Delete problem
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </span>
    </>
  );

  const classes = cn(
    s.row,
    interactive && s.interactive,
    href && s.linkRow,
    focused && s.focused,
    dimmed && s.dimmed,
    dragging && s.dragging,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} data-level={level ?? ""} ref={ref as React.Ref<HTMLAnchorElement>} style={style}>
        {body}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className={classes}
      data-level={level ?? ""}
      data-problem-id={problem.id}
      style={style}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onOpen : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen?.();
              }
            }
          : undefined
      }
    >
      {body}
    </div>
  );
});
