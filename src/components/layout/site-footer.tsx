import { Github, Linkedin, Mail } from "lucide-react";
import { PORTFOLIO_URL } from "@/lib/env";
import s from "./site-footer.module.scss";

const EMAIL = "roger@roger.tw";

export function SiteFooter() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.links}>
          <a href={`mailto:${EMAIL}`} className={s.email}>
            <Mail size={14} aria-hidden />
            <span>{EMAIL}</span>
          </a>
          <a href="https://github.com/rogerfan48" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={s.icon}>
            <Github size={16} />
          </a>
          <a href="https://linkedin.com/in/rogerfan48" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={s.icon}>
            <Linkedin size={16} />
          </a>
          <a href={PORTFOLIO_URL} className={s.site}>
            roger.tw
          </a>
        </div>
        <p className={s.copyright}>© {new Date().getFullYear()} Roger Fan. All rights reserved.</p>
      </div>
    </footer>
  );
}
