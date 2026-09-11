import { ApiError } from "./api";
import { prisma } from "./prisma";

export async function getOwnedProblem(userId: string, id: string) {
  const problem = await prisma.problem.findFirst({ where: { id, userId } });
  if (!problem) throw new ApiError(404, "Problem not found");
  return problem;
}

// Tags are looked up case-insensitively so "two pointers" and "Two Pointers" don't fork
export async function connectTags(userId: string, tagNames: string[]) {
  const existing = await prisma.tag.findMany({ where: { userId } });
  const byLower = new Map(existing.map((t) => [t.name.toLowerCase(), t]));
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const raw of tagNames) {
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const found = byLower.get(key);
    if (found) {
      ids.push(found.id);
    } else {
      const created = await prisma.tag.create({ data: { userId, name: raw } });
      byLower.set(key, created);
      ids.push(created.id);
    }
  }
  return ids.map((id) => ({ id }));
}
