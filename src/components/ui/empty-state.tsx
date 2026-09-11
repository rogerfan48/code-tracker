import s from "./empty-state.module.scss";

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className={s.empty}>
      <p className={s.title}>{title}</p>
      {body ? <p className={s.body}>{body}</p> : null}
      {action}
    </div>
  );
}
