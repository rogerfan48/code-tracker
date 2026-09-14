"use client";

import { useEffect, useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollbarHover, useStoredValue } from "@/lib/hooks";
import type { MainNode } from "@/lib/selectors";
import s from "./toc.module.scss";

const MIN_WIDTH = 160;
const MAX_WIDTH = 420;
// keep the active entry this far from the list's edges, like vim's scrolloff
const SCROLLOFF = 100;
// must match --page-gap in tokens.css
const PAGE_GAP = 20;

function scrollToCategory(id: string, offset: number) {
  const el = document.querySelector<HTMLElement>(`[data-category-id="${CSS.escape(id)}"]`);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset - 8, behavior: "smooth" });
}

/** offset: height of everything sticky above the list; sections scrolled past it count as "current" */
export function Toc({ tree, collapsed, offset, onExpand }: { tree: MainNode[]; collapsed: Set<string>; offset: number; onExpand: (ids: string[]) => void }) {
  const [active, setActive] = useState<{ main: string | null; sub: string | null }>({ main: null, sub: null });
  const [open, setOpen] = useStoredValue<boolean>("ct.tocOpen", true);
  const [width, setWidth] = useStoredValue<number>("ct.tocWidth", 220);
  const listRef = useRef<HTMLDivElement>(null);
  useScrollbarHover(listRef);
  const slotRef = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [bottomLimit, setBottomLimit] = useState<number | null>(null);
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);

  // The panel is position: fixed so it never moves with the page; the slot only reserves grid space.
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const measure = () => setLeft(slot.getBoundingClientRect().left);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = document.querySelectorAll<HTMLElement>("[data-category-id]");
      let main: string | null = null;
      let sub: string | null = null;
      for (const el of sections) {
        // a header sitting just under the sticky line already reads as the current section
        if (el.getBoundingClientRect().top - offset > 96) break;
        const id = el.dataset.categoryId!;
        if (el.tagName === "SECTION") {
          main = id;
          sub = null;
        } else {
          sub = id;
        }
      }
      if (!main && sections.length) main = sections[0].dataset.categoryId ?? null;
      // at the very bottom nothing more can scroll past the line, so the last section is the current one
      if (sections.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        const last = sections[sections.length - 1];
        const lastMain = last.closest<HTMLElement>("section[data-category-id]");
        main = lastMain?.dataset.categoryId ?? main;
        sub = last.tagName === "SECTION" ? null : last.dataset.categoryId!;
      }
      setActive((prev) => (prev.main === main && prev.sub === sub ? prev : { main, sub }));
      // shrink above the footer instead of covering it
      const footer = document.querySelector("footer");
      setBottomLimit(footer ? footer.getBoundingClientRect().top : null);
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
  }, [tree, collapsed, offset]);

  // keep the highlighted entry inside the list viewport with a scrolloff buffer
  useEffect(() => {
    const list = listRef.current;
    const id = active.sub ?? active.main;
    if (!list || !id) return;
    const el = list.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(id)}"]`);
    if (!el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    const viewTop = list.scrollTop;
    const viewBottom = viewTop + list.clientHeight;
    let next: number | null = null;
    if (top < viewTop + SCROLLOFF) next = top - SCROLLOFF;
    else if (bottom > viewBottom - SCROLLOFF) next = bottom - list.clientHeight + SCROLLOFF;
    if (next !== null) list.scrollTo({ top: Math.max(0, next), behavior: "smooth" });
  }, [active]);

  const go = (ids: string[]) => {
    const hidden = ids.filter((id) => collapsed.has(id));
    if (hidden.length) onExpand(hidden);
    // let the expanded section render before measuring
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToCategory(ids[ids.length - 1], offset)));
  };

  const onResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { startX: e.clientX, startWidth: width };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, drag.current.startWidth + e.clientX - drag.current.startX));
    setWidth(next);
  };
  const onResizeEnd = () => {
    drag.current = null;
  };

  if (tree.length === 0) return null;

  const panelStyle = {
    left: left ?? undefined,
    visibility: left === null ? "hidden" : undefined,
    maxHeight: bottomLimit === null ? undefined : Math.max(120, bottomLimit - offset - PAGE_GAP * 2),
  } as React.CSSProperties;

  if (!open) {
    return (
      <div className={s.slot} ref={slotRef} style={{ width: 36 }}>
        <div className={cn(s.rail, s.fixed)} style={panelStyle}>
          <button type="button" className={s.toggle} onClick={() => setOpen(true)} aria-label="Show table of contents" title="Show contents">
            <PanelLeftOpen size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.slot} ref={slotRef} style={{ width }}>
    <aside className={cn(s.sidebar, s.fixed)} style={{ ...panelStyle, width }} aria-label="Table of contents">
      <div className={s.head}>
        <p className={s.heading}>Contents</p>
        <button type="button" className={s.toggle} onClick={() => setOpen(false)} aria-label="Hide table of contents" title="Hide contents">
          <PanelLeftClose size={16} />
        </button>
      </div>
      <div className={s.list} ref={listRef}>
        <ul>
          {tree.map((main) => {
            const mainActive = active.main === main.category.id;
            return (
              <li key={main.category.id}>
                <button type="button" data-toc-id={main.category.id} className={cn(s.item, s.main, mainActive && s.active)} onClick={() => go([main.category.id])} aria-current={mainActive ? "location" : undefined}>
                  {main.category.name}
                </button>
                <ul className={s.subs}>
                  {main.subs.map((sub) => {
                    const subActive = mainActive && active.sub === sub.category.id;
                    return (
                      <li key={sub.category.id}>
                        <button type="button" data-toc-id={sub.category.id} className={cn(s.item, s.sub, subActive && s.active)} onClick={() => go([main.category.id, sub.category.id])} aria-current={subActive ? "location" : undefined}>
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
      </div>
      <div
        className={s.resizer}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize table of contents"
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        onPointerCancel={onResizeEnd}
      >
        <span />
      </div>
    </aside>
    </div>
  );
}
