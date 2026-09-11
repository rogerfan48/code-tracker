"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useTracker } from "./tracker-provider";
import { api } from "@/lib/client-api";
import { formatLocalDate } from "@/lib/due";
import type { Level, ProblemDto, RecordDto } from "@/types/tracker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LevelPicker } from "./level-picker";
import { LevelChip } from "./level-chip";
import { DifficultyMark } from "./difficulty";
import s from "./practice-dialog.module.scss";

export function PracticeDialog({ problemId, onOpenChange }: { problemId: string | null; onOpenChange: (open: boolean) => void }) {
  const { problemsById, today, mutate } = useTracker();
  const problem = problemId ? problemsById.get(problemId) : undefined;
  return (
    <Dialog open={Boolean(problem)} onOpenChange={onOpenChange}>
      {problem ? <PracticeForm key={problem.id} problem={problem} today={today} mutate={mutate} close={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function PracticeForm({ problem, today, mutate, close }: { problem: ProblemDto; today: Date; mutate: ReturnType<typeof useTracker>["mutate"]; close: () => void }) {
  const [editing, setEditing] = useState<RecordDto | null>(null);
  const [date, setDate] = useState(formatLocalDate(today));
  const [level, setLevel] = useState<Level | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<RecordDto | null>(null);

  const startEdit = (record: RecordDto) => {
    setEditing(record);
    setDate(record.date);
    setLevel(record.level);
    setNote(record.note ?? "");
    setError("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setDate(formatLocalDate(today));
    setLevel(null);
    setNote("");
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (level === null) {
      setError("Pick a familiarity level");
      return;
    }
    if (!date) {
      setError("Pick a date");
      return;
    }
    setBusy(true);
    try {
      const body = { date, level, note: note.trim() || null };
      if (editing) {
        await mutate(() => api(`/api/records/${editing.id}`, { method: "PATCH", json: body }), { success: "Record updated" });
        cancelEdit();
      } else {
        await mutate(() => api(`/api/problems/${problem.id}/records`, { method: "POST", json: body }), { success: "Practice recorded" });
        close();
      }
    } catch {
      /* toasted by mutate */
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent size="md" className={s.content}>
      <DialogHeader>
        <DialogTitle className={s.title}>
          <span className={s.number}>{problem.number}</span>
          <span>{problem.title}</span>
          <DifficultyMark difficulty={problem.difficulty} />
          {problem.url ? (
            <a href={problem.url} target="_blank" rel="noreferrer" className={s.link} aria-label="Open problem">
              <ExternalLink size={14} />
            </a>
          ) : null}
        </DialogTitle>
        <DialogDescription>{editing ? `Editing the record from ${editing.date}` : "Log a practice session"}</DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className={s.form}>
        <Field label="Date">
          <Input type="date" value={date} max={formatLocalDate(today)} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="How did it feel?" error={error || undefined}>
          <LevelPicker value={level} onChange={(l) => { setLevel(l); setError(""); }} />
        </Field>
        <Field label="Note" hint="Optional">
          <Input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="e.g. forgot the edge case for empty input" />
        </Field>
        <DialogFooter>
          {editing ? (
            <Button type="button" variant="ghost" onClick={cancelEdit} disabled={busy}>
              Cancel edit
            </Button>
          ) : null}
          <Button type="submit" variant="primary" loading={busy}>
            {editing ? "Save changes" : "Add record"}
          </Button>
        </DialogFooter>
      </form>

      {problem.records.length ? (
        <section className={s.records} aria-label="Previous records">
          <h3 className={s.recordsTitle}>History</h3>
          <ul className={s.recordList}>
            {problem.records.map((r) => (
              <li key={r.id} className={s.record} data-editing={editing?.id === r.id || undefined}>
                <LevelChip level={r.level} size="sm" />
                <span className={s.recordDate}>{r.date}</span>
                <span className={s.recordNote}>{r.note}</span>
                <span className={s.recordActions}>
                  <Button type="button" variant="ghost" size="iconSm" aria-label="Edit record" onClick={() => startEdit(r)}>
                    <Pencil size={14} />
                  </Button>
                  <Button type="button" variant="ghost" size="iconSm" aria-label="Delete record" onClick={() => setDeleting(r)}>
                    <Trash2 size={14} />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className={s.emptyHint}>No practice recorded yet.</p>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this record?"
        description={deleting ? `${deleting.date} · level ${deleting.level}` : undefined}
        onConfirm={async () => {
          if (!deleting) return;
          await mutate(() => api(`/api/records/${deleting.id}`, { method: "DELETE" }), { success: "Record deleted" });
          if (editing?.id === deleting.id) cancelEdit();
        }}
      />
    </DialogContent>
  );
}
