"use client";

import { useMemo, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { useTracker } from "./tracker-provider";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { TAG_COLORS, type TagColor, type TagDto } from "@/types/tracker";
import { LEVEL_LABELS } from "./level-chip";
import { TagChip } from "./tag-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import s from "./settings-view.module.scss";

export function SettingsView() {
  const { data } = useTracker();
  return (
    <div className={s.page}>
      <h1 className={s.title}>Settings</h1>
      <IntervalsForm key={`${data.settings.intervals.join(",")}:${data.settings.soonDays}`} />
      <TagManager />
    </div>
  );
}

function IntervalsForm() {
  const { data, mutate } = useTracker();
  const [values, setValues] = useState<string[]>(() => data.settings.intervals.map(String));
  const [soon, setSoon] = useState(String(data.settings.soonDays));
  const [busy, setBusy] = useState(false);

  const dirty = values.some((v, i) => Number(v) !== data.settings.intervals[i]) || Number(soon) !== data.settings.soonDays;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const intervals = values.map((v) => Math.max(0, Math.min(3650, Math.round(Number(v) || 0))));
    const soonDays = Math.max(1, Math.min(365, Math.round(Number(soon) || 1)));
    setBusy(true);
    try {
      await mutate(() => api("/api/settings", { method: "PUT", json: { intervals, soonDays } }), { success: "Settings saved" });
    } catch {
      /* toasted */
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={s.card}>
      <header className={s.cardHeader}>
        <h2 className={s.cardTitle}>Re-practice intervals</h2>
        <p className={s.cardSub}>How many days after a practice at each familiarity level the problem becomes due again. 0 means it never comes back.</p>
      </header>
      <form onSubmit={submit} className={s.intervals}>
        {values.map((v, level) => (
          <label key={level} className={s.interval}>
            <span className={cn(s.levelDot, s[`level${level}`])}>{level}</span>
            <span className={s.intervalLabel}>{LEVEL_LABELS[level as 0 | 1 | 2 | 3]}</span>
            <span className={s.intervalInput}>
              <Input type="number" min={0} max={3650} inputMode="numeric" value={v} onChange={(e) => setValues((vs) => vs.map((x, i) => (i === level ? e.target.value : x)))} aria-label={`Days for level ${level}`} />
              <span className={s.unit}>{Number(v) === 0 ? "never" : "days"}</span>
            </span>
          </label>
        ))}
        <label className={cn(s.interval, s.soonRow)}>
          <span className={s.soonDot} aria-hidden />
          <span className={s.intervalLabel}>“Soon” window</span>
          <span className={s.intervalInput}>
            <Input type="number" min={1} max={365} inputMode="numeric" value={soon} onChange={(e) => setSoon(e.target.value)} aria-label="Days counted as soon" />
            <span className={s.unit}>days</span>
          </span>
          <span className={s.soonHint}>Problems due within this many days show as “soon” in the list and under “Coming up” on the Due page.</span>
        </label>
        <div className={s.intervalActions}>
          <Button type="submit" variant="primary" loading={busy} disabled={!dirty}>
            Save
          </Button>
        </div>
      </form>
    </section>
  );
}

function TagManager() {
  const { data, mutate } = useTracker();
  const [deleting, setDeleting] = useState<TagDto | null>(null);
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of data.problems) for (const id of p.tagIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
  }, [data.problems]);

  const patch = (tag: TagDto, body: { name?: string; color?: TagColor }) => mutate(() => api(`/api/tags/${tag.id}`, { method: "PATCH", json: body }));

  return (
    <section className={s.card}>
      <header className={s.cardHeader}>
        <h2 className={s.cardTitle}>Tags</h2>
        <p className={s.cardSub}>Rename tags, pick their color, or remove ones you no longer use. New tags are created from the problem dialog.</p>
      </header>
      {data.tags.length === 0 ? (
        <p className={s.empty}>No tags yet.</p>
      ) : (
        <ul className={s.tagList}>
          {data.tags.map((tag) => (
            <li key={tag.id} className={s.tagRow}>
              <DropdownMenu>
                <DropdownMenuTrigger className={s.swatchBtn} aria-label={`Color for ${tag.name}: ${tag.color}`}>
                  <TagChip name={tag.name} color={tag.color} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={s.palette}>
                  {TAG_COLORS.map((c) => (
                    <button key={c} type="button" className={s.swatch} data-color={c} aria-label={c} onClick={() => patch(tag, { color: c })}>
                      {c === tag.color ? <Check size={12} /> : null}
                    </button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <TagName key={tag.name} tag={tag} onSave={(name) => patch(tag, { name })} />
              <span className={s.usage}>{usage.get(tag.id) ?? 0} problems</span>
              <Button variant="ghost" size="iconSm" aria-label={`Delete tag ${tag.name}`} className={s.deleteBtn} onClick={() => setDeleting(tag)}>
                <Trash2 size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete tag “${deleting?.name}”?`}
        description={deleting ? `It will be removed from ${usage.get(deleting.id) ?? 0} problems.` : undefined}
        onConfirm={async () => {
          if (!deleting) return;
          await mutate(() => api(`/api/tags/${deleting.id}`, { method: "DELETE" }), { success: "Tag deleted" });
        }}
      />
    </section>
  );
}

function TagName({ tag, onSave }: { tag: TagDto; onSave: (name: string) => Promise<unknown> }) {
  const [value, setValue] = useState(tag.name);
  const commit = async () => {
    const next = value.trim();
    if (!next || next === tag.name) {
      setValue(tag.name);
      return;
    }
    try {
      await onSave(next);
    } catch {
      setValue(tag.name);
    }
  };
  return (
    <Input
      className={s.tagName}
      value={value}
      maxLength={40}
      aria-label={`Rename ${tag.name}`}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setValue(tag.name);
      }}
    />
  );
}
