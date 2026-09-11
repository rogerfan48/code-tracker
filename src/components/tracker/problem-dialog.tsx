"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTracker } from "./tracker-provider";
import { api } from "@/lib/client-api";
import { errorMessage, cn } from "@/lib/utils";
import type { LeetCodeLookup } from "@/lib/leetcode";
import type { Difficulty, ProblemDto, ProblemSource } from "@/types/tracker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TagInput } from "./tag-input";
import { CategorySelect } from "./category-select";
import { DIFFICULTY_LABELS } from "./difficulty";
import s from "./problem-dialog.module.scss";

export type ProblemDialogState = { mode: "create"; categoryId?: string } | { mode: "edit"; problemId: string } | null;

interface FormState {
  source: ProblemSource;
  number: string;
  title: string;
  difficulty: Difficulty | "";
  url: string;
  categoryId: string;
  tagNames: string[];
}

export function ProblemDialog({ state, onOpenChange }: { state: ProblemDialogState; onOpenChange: (open: boolean) => void }) {
  const { problemsById } = useTracker();
  const problem = state?.mode === "edit" ? problemsById.get(state.problemId) : undefined;
  const open = state?.mode === "create" || Boolean(problem);
  const key = state?.mode === "edit" ? state.problemId : `create:${state?.categoryId ?? ""}`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <ProblemForm key={key} problem={problem} initialCategoryId={state?.mode === "create" ? state.categoryId : undefined} close={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function ProblemForm({ problem, initialCategoryId, close }: { problem?: ProblemDto; initialCategoryId?: string; close: () => void }) {
  const { tree, data, tagsById, mutate } = useTracker();
  const [form, setForm] = useState<FormState>(() =>
    problem
      ? {
          source: problem.source,
          number: problem.number,
          title: problem.title,
          difficulty: problem.difficulty ?? "",
          url: problem.url ?? "",
          categoryId: problem.categoryId,
          tagNames: problem.tagIds.map((id) => tagsById.get(id)?.name).filter((n): n is string => Boolean(n)),
        }
      : { source: "LEETCODE", number: "", title: "", difficulty: "", url: "", categoryId: initialCategoryId ?? "", tagNames: [] },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!form.number.trim()) next.number = "Required";
    else if (form.source === "LEETCODE" && !/^\d+$/.test(form.number.trim())) next.number = "LeetCode numbers are integers";
    if (!form.title.trim()) next.title = "Required";
    if (form.source === "LEETCODE" && !form.difficulty) next.difficulty = "Required for LeetCode problems";
    if (!form.categoryId) next.categoryId = "Pick a sub category";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const fetchLeetCode = async () => {
    const number = form.number.trim();
    if (!/^\d+$/.test(number)) {
      setErrors((e) => ({ ...e, number: "Enter the LeetCode number first" }));
      return;
    }
    setFetching(true);
    try {
      const info = await api<LeetCodeLookup>(`/api/leetcode/lookup?number=${number}`);
      setForm((f) => ({
        ...f,
        title: info.title,
        difficulty: info.difficulty,
        url: info.url,
        tagNames: [...new Set([...f.tagNames, ...info.topicTags])],
      }));
      setErrors({});
      toast.success(`Loaded “${info.title}”${info.paidOnly ? " (premium problem)" : ""}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setFetching(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const body = {
      categoryId: form.categoryId,
      source: form.source,
      number: form.number.trim(),
      title: form.title.trim(),
      difficulty: form.difficulty || null,
      url: form.url.trim() || null,
      tagNames: form.tagNames,
    };
    try {
      if (problem) {
        await mutate(() => api(`/api/problems/${problem.id}`, { method: "PATCH", json: body }), { success: "Problem updated" });
      } else {
        await mutate(() => api("/api/problems", { method: "POST", json: body }), { success: "Problem added" });
      }
      close();
    } catch {
      /* toasted */
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent size="lg">
      <DialogHeader>
        <DialogTitle>{problem ? "Edit problem" : "Add problem"}</DialogTitle>
        <DialogDescription>
          {form.source === "LEETCODE" ? "Type the LeetCode number and fetch to fill in the rest." : "Custom problems can have any number, and difficulty is optional."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className={s.form}>
        <div className={s.sourceRow} role="radiogroup" aria-label="Source">
          {(["LEETCODE", "CUSTOM"] as const).map((src) => (
            <button key={src} type="button" role="radio" aria-checked={form.source === src} className={cn(s.sourceBtn, form.source === src && s.sourceActive)} onClick={() => set("source", src)}>
              {src === "LEETCODE" ? "LeetCode" : "Custom"}
            </button>
          ))}
        </div>

        <div className={s.grid}>
          <Field label="Number" error={errors.number} className={s.number}>
            <div className={s.numberRow}>
              <Input
                value={form.number}
                inputMode={form.source === "LEETCODE" ? "numeric" : undefined}
                placeholder={form.source === "LEETCODE" ? "169" : "KamaCode 99"}
                onChange={(e) => set("number", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && form.source === "LEETCODE") {
                    e.preventDefault();
                    fetchLeetCode();
                  }
                }}
                autoFocus
              />
              {form.source === "LEETCODE" ? (
                <Button type="button" onClick={fetchLeetCode} loading={fetching} aria-label="Fetch from LeetCode">
                  <Download size={14} /> Fetch
                </Button>
              ) : null}
            </div>
          </Field>
          <Field label="Difficulty" error={errors.difficulty} className={s.difficulty}>
            <Select value={form.difficulty || "none"} onValueChange={(v) => set("difficulty", v === "none" ? "" : (v as Difficulty))}>
              <SelectTrigger aria-label="Difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {form.source === "CUSTOM" ? <SelectItem value="none">Not set</SelectItem> : null}
                {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                  <SelectItem key={d} value={d}>
                    {DIFFICULTY_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Title" error={errors.title} className={s.full}>
            <Input value={form.title} maxLength={200} onChange={(e) => set("title", e.target.value)} placeholder="Majority Element" />
          </Field>
          <Field label="URL" hint="Optional" className={s.full}>
            <Input type="url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://leetcode.com/problems/majority-element/" />
          </Field>
          <Field label="Category" error={errors.categoryId} className={s.full}>
            <CategorySelect tree={tree} value={form.categoryId} onChange={(id) => set("categoryId", id)} />
          </Field>
          <Field label="Tags" hint="Enter to add, Backspace to remove" className={s.full}>
            <TagInput value={form.tagNames} onChange={(v) => set("tagNames", v)} suggestions={data.tags} />
          </Field>
        </div>

        <DialogFooter className={s.footer}>
          {problem ? (
            <Button type="button" variant="ghost" className={s.deleteBtn} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            {problem ? "Save changes" : "Add problem"}
          </Button>
        </DialogFooter>
      </form>

      {problem ? (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete “${problem.title}”?`}
          description={`${problem.records.length} practice record${problem.records.length === 1 ? "" : "s"} will be deleted with it.`}
          onConfirm={async () => {
            await mutate(() => api(`/api/problems/${problem.id}`, { method: "DELETE" }), { success: "Problem deleted" });
            close();
          }}
        />
      ) : null}
    </DialogContent>
  );
}
