import { cn } from "@/lib/utils";
import s from "./wordmark.module.scss";

export function Wordmark({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  return (
    <span className={cn(s.mark, size === "lg" && s.lg, className)}>
      <span className={s.glyph} aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span className={s.text}>
        Code<span className={s.accent}>Tracker</span>
      </span>
    </span>
  );
}
