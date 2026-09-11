"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

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
