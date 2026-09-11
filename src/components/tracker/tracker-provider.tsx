"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Bootstrap, CategoryDto, ProblemDto, TagDto } from "@/types/tracker";
import { todayLocal, type DueInfo } from "@/lib/due";
import { api } from "@/lib/client-api";
import { errorMessage } from "@/lib/utils";
import { buildTree, computeDueMap, indexById, type MainNode } from "@/lib/selectors";
import { TooltipProvider } from "@/components/ui/tooltip";

interface TrackerContextValue {
  data: Bootstrap;
  today: Date;
  tree: MainNode[];
  dueMap: Map<string, DueInfo>;
  categoriesById: Map<string, CategoryDto>;
  problemsById: Map<string, ProblemDto>;
  tagsById: Map<string, TagDto>;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<Bootstrap>>;
  /** Run a mutation, then refetch; errors are toasted and rethrown. */
  mutate: <T>(run: () => Promise<T>, opts?: { optimistic?: (d: Bootstrap) => Bootstrap; success?: string }) => Promise<T>;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ initial, children }: { initial: Bootstrap; children: React.ReactNode }) {
  const [data, setData] = useState(initial);
  // The server can't know the browser's calendar day, so day-math waits for mount.
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = () => setToday((prev) => {
      const next = todayLocal();
      return prev && prev.getTime() === next.getTime() ? prev : next;
    });
    refresh();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const reload = useCallback(async () => {
    setData(await api<Bootstrap>("/api/bootstrap"));
  }, []);

  const mutate = useCallback<TrackerContextValue["mutate"]>(
    async (run, opts) => {
      let snapshot: Bootstrap | null = null;
      if (opts?.optimistic) {
        setData((d) => {
          snapshot = d;
          return opts.optimistic!(d);
        });
      }
      try {
        const result = await run();
        await reload();
        if (opts?.success) toast.success(opts.success);
        return result;
      } catch (err) {
        if (snapshot) setData(snapshot);
        toast.error(errorMessage(err));
        throw err;
      }
    },
    [reload],
  );

  const value = useMemo<TrackerContextValue | null>(() => {
    if (!today) return null;
    return {
      data,
      today,
      tree: buildTree(data),
      dueMap: computeDueMap(data, today),
      categoriesById: indexById(data.categories),
      problemsById: indexById(data.problems),
      tagsById: indexById(data.tags),
      reload,
      setData,
      mutate,
    };
  }, [data, today, reload, mutate]);

  if (!value) return null;
  return (
    <TrackerContext.Provider value={value}>
      <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used inside TrackerProvider");
  return ctx;
}
