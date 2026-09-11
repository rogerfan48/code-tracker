"use client";

import { useId, useMemo, useState } from "react";
import type { TagDto } from "@/types/tracker";
import { TagChip } from "./tag-chip";
import s from "./tag-input.module.scss";

export function TagInput({ value, onChange, suggestions }: { value: string[]; onChange: (next: string[]) => void; suggestions: TagDto[] }) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const byName = useMemo(() => new Map(suggestions.map((t) => [t.name.toLowerCase(), t])), [suggestions]);

  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    const chosen = new Set(value.map((v) => v.toLowerCase()));
    return suggestions.filter((t) => !chosen.has(t.name.toLowerCase()) && (!q || t.name.toLowerCase().includes(q))).slice(0, 8);
  }, [draft, suggestions, value]);

  const add = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    const canonical = byName.get(name.toLowerCase())?.name ?? name;
    if (!value.some((v) => v.toLowerCase() === canonical.toLowerCase())) onChange([...value, canonical]);
    setDraft("");
  };

  const remove = (name: string) => onChange(value.filter((v) => v !== name));

  return (
    <div className={s.wrap}>
      <div className={s.box} onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}>
        {value.map((name) => (
          <TagChip key={name} name={name} color={byName.get(name.toLowerCase())?.color ?? "gray"} onRemove={() => remove(name)} />
        ))}
        <input
          className={s.input}
          value={draft}
          placeholder={value.length ? "" : "Add tags…"}
          role="combobox"
          aria-label="Add tag"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open && matches.length > 0}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {open && (matches.length > 0 || draft.trim()) ? (
        <ul className={s.menu} id={listId} role="listbox">
          {matches.map((t) => (
            <li key={t.id}>
              <button type="button" role="option" aria-selected={false} className={s.option} onMouseDown={(e) => e.preventDefault()} onClick={() => add(t.name)}>
                <TagChip name={t.name} color={t.color} />
              </button>
            </li>
          ))}
          {draft.trim() && !byName.has(draft.trim().toLowerCase()) ? (
            <li>
              <button type="button" role="option" aria-selected={false} className={s.option} onMouseDown={(e) => e.preventDefault()} onClick={() => add(draft)}>
                Create “{draft.trim()}”
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
