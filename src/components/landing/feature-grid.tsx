import { CalendarClock, FolderTree, GaugeCircle, History } from "lucide-react";
import s from "./landing.module.scss";

const FEATURES = [
  {
    icon: FolderTree,
    title: "Category tree",
    body: "Main and sub categories you fully control: rename, reorder, drag problems between them.",
  },
  {
    icon: GaugeCircle,
    title: "Familiarity, not just done",
    body: "Every attempt is logged with a 0–3 familiarity level, so the history shows how it really went.",
  },
  {
    icon: CalendarClock,
    title: "Due by your own intervals",
    body: "Set how many days each level earns before a re-practice. Overdue problems are impossible to miss.",
  },
  {
    icon: History,
    title: "Due, Recent, Stats",
    body: "Plan today's session from the Due list, review what you did recently, watch weekly momentum.",
  },
];

export function FeatureGrid() {
  return (
    <section className={s.features} aria-label="Features">
      {FEATURES.map(({ icon: Icon, title, body }) => (
        <article key={title} className={s.feature}>
          <span className={s.featureIcon}>
            <Icon size={18} aria-hidden />
          </span>
          <h2>{title}</h2>
          <p>{body}</p>
        </article>
      ))}
    </section>
  );
}
