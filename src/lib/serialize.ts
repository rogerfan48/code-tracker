import type { Prisma } from "@prisma/client";
import { toDateString } from "./api";
import type { Bootstrap, CategoryDto, Level, ProblemDto, RecordDto, SettingsDto, TagColor, TagDto } from "@/types/tracker";
import { prisma } from "./prisma";

export const problemInclude = {
  tags: { select: { id: true } },
  records: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
} satisfies Prisma.ProblemInclude;

type ProblemRow = Prisma.ProblemGetPayload<{ include: typeof problemInclude }>;

export function serializeRecord(r: { id: string; problemId: string; date: Date; level: number; note: string | null }): RecordDto {
  return { id: r.id, problemId: r.problemId, date: toDateString(r.date), level: r.level as Level, note: r.note };
}

export function serializeProblem(p: ProblemRow): ProblemDto {
  return {
    id: p.id,
    categoryId: p.categoryId,
    source: p.source,
    number: p.number,
    title: p.title,
    difficulty: p.difficulty,
    url: p.url,
    position: p.position,
    tagIds: p.tags.map((t) => t.id),
    records: p.records.map(serializeRecord),
  };
}

export function serializeCategory(c: { id: string; name: string; parentId: string | null; position: number }): CategoryDto {
  return { id: c.id, name: c.name, parentId: c.parentId, position: c.position };
}

export function serializeTag(t: { id: string; name: string; color: string }): TagDto {
  return { id: t.id, name: t.name, color: t.color as TagColor };
}

export async function loadSettings(userId: string): Promise<SettingsDto> {
  const s = await prisma.userSettings.findUnique({ where: { userId } });
  return { intervals: s ? [s.interval0, s.interval1, s.interval2, s.interval3] : [0, 90, 30, 14] };
}

export async function loadBootstrap(userId: string): Promise<Bootstrap> {
  const [categories, problems, tags, settings] = await Promise.all([
    prisma.category.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.problem.findMany({ where: { userId }, include: problemInclude, orderBy: { position: "asc" } }),
    prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    loadSettings(userId),
  ]);
  return {
    categories: categories.map(serializeCategory),
    problems: problems.map(serializeProblem),
    tags: tags.map(serializeTag),
    settings,
  };
}
