import * as React from "react";
import { cn } from "@/lib/utils";
import s from "./field.module.scss";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(s.input, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(s.input, s.textarea, className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn(s.label, className)} {...props} />;
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(s.field, className)}>
      <span className={s.label}>{label}</span>
      {children}
      {error ? <span className={s.error} role="alert">{error}</span> : hint ? <span className={s.hint}>{hint}</span> : null}
    </div>
  );
}
