import { z } from "zod";
import { TAG_COLORS } from "@/types/tracker";

const name = z.string().trim().min(1, "Name is required").max(80);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const url = z.union([z.url({ protocol: /^https?$/ }).max(500), z.literal("")]).transform((v) => (v === "" ? null : v));

export const categoryCreate = z.object({ name, parentId: z.string().nullable().optional() });
export const categoryPatch = z.object({ name });
export const categoryReorder = z.object({ parentId: z.string().nullable(), orderedIds: z.array(z.string()).min(1) });

const problemBase = z.object({
  categoryId: z.string(),
  source: z.enum(["LEETCODE", "CUSTOM"]),
  number: z.string().trim().min(1, "Number is required").max(40),
  title: z.string().trim().min(1, "Title is required").max(200),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).nullable(),
  url: url.nullable(),
  tagNames: z.array(z.string().trim().min(1).max(40)).max(20),
});

export const problemInput = problemBase.superRefine((p, ctx) => {
  if (p.source === "LEETCODE") {
    if (!/^\d+$/.test(p.number)) ctx.addIssue({ code: "custom", path: ["number"], message: "LeetCode number must be an integer" });
    if (!p.difficulty) ctx.addIssue({ code: "custom", path: ["difficulty"], message: "Difficulty is required for LeetCode problems" });
  }
});
export type ProblemInput = z.infer<typeof problemInput>;
export const problemReorder = z.object({ categoryId: z.string(), orderedIds: z.array(z.string()) });

export const recordCreate = z.object({
  date: dateString,
  level: z.number().int().min(0).max(3),
  note: z.string().trim().max(500).nullable().optional(),
});
export const recordPatch = recordCreate;

export const tagCreate = z.object({ name: name.max(40), color: z.enum(TAG_COLORS).optional() });
export const tagPatch = z.object({ name: name.max(40).optional(), color: z.enum(TAG_COLORS).optional() });

const interval = z.number().int().min(0).max(3650);
export const settingsPut = z.object({ intervals: z.tuple([interval, interval, interval, interval]), soonDays: z.number().int().min(1).max(365) });
