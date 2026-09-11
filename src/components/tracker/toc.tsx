"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { MainNode } from "@/lib/selectors";
import s from "./toc.module.scss";

// Sticky app header + sticky sub header; sections scrolled above this line count as "passed"
const SCROLL_OFFSET = 120;

function scrollToCategory(id: string) {
  const el = document.querySelector<HTMLElement>(`[data-category-id="${CSS.escape(id)}"]`);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET + 8, behavior: "smooth" });
}

export function Toc({ tree, collapsed, onExpand }: { tree: MainNode[]; collapsed: Set<string>; onExpand: (ids: string[]) => void }) {
  const [active, setActive] = useState<{ main: string | null; sub: string | null }>({ main: null, sub: null });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = document.querySelectorAll<HTMLElement>("[data-category-id]");
      let main: string | null = null;
      let sub: string | null = null;
      for (const el of sections) {
        if (el.getBoundingClientRect().top - SCROLL_OFFSET > 0) break;
        const id = el.dataset.categoryId!;
        if (el.tagName === "SECTION") {
          main = id;
          sub = null;
        } else {
          sub = id;
        }
      }
      if (!main && sections.length) main = sections[0].dataset.categoryId ?? null;
      setActive((prev) => (prev.main === main && prev.sub === sub ? prev : { main, sub }));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tree, collapsed]);

  const go = (ids: string[]) => {
    const hidden = ids.filter((id) => collapsed.has(id));
    if (hidden.length) onExpand(hidden);
    // let the expanded section render before measuring
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToCategory(ids[ids.length - 1])));
  };

  if (tree.length === 0) return null;

  return (
    <nav className={s.toc} aria-label="Table of contents">
      <p className={s.heading}>Contents</p>
      <ul className={s.list}>
        {tree.map((main) => {
          const mainActive = active.main === main.category.id;
          return (
            <li key={main.category.id}>
              <button type="button" className={cn(s.item, s.main, mainActive && s.active)} onClick={() => go([main.category.id])} aria-current={mainActive ? "location" : undefined}>
                {main.category.name}
              </button>
              <ul className={s.subs}>
                {main.subs.map((sub) => {
                  const subActive = mainActive && active.sub === sub.category.id;
                  return (
                    <li key={sub.category.id}>
                      <button type="button" className={cn(s.item, s.sub, subActive && s.active)} onClick={() => go([main.category.id, sub.category.id])} aria-current={subActive ? "location" : undefined}>
                        {sub.category.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
