"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore, type RefObject } from "react";

const EVENT = "ct:storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

// localStorage may be unavailable (private mode, blocked); reads and writes fail silently
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useStoredValue<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);

  const value = useMemo<T>(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [raw, initial]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(value) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}
      window.dispatchEvent(new Event(EVENT));
    },
    [key, value],
  );

  return [value, update];
}

// Firefox cannot style a hovered scrollbar thumb, so the hover state is detected from the pointer
// position and exposed as [data-scrollbar-hover]. Without a ref it tracks the page scrollbar.
export function useScrollbarHover(ref?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref ? ref.current : document.documentElement;
    if (!el) return;
    const isRoot = el === document.documentElement;
    const onMove = (e: MouseEvent) => {
      let over: boolean;
      if (isRoot) {
        over = e.clientX >= el.clientWidth;
      } else {
        const borderRight = parseFloat(getComputedStyle(el).borderRightWidth) || 0;
        const right = el.getBoundingClientRect().right - borderRight;
        const barWidth = el.offsetWidth - el.clientWidth - el.clientLeft - borderRight;
        over = barWidth > 0 && e.clientX >= right - barWidth && e.clientX < right;
      }
      el.toggleAttribute("data-scrollbar-hover", over);
    };
    const onLeave = () => el.removeAttribute("data-scrollbar-hover");
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.removeAttribute("data-scrollbar-hover");
    };
  }, [ref]);
}
