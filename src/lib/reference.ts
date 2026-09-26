import type { PrismaClient } from "@prisma/client";
import reference from "../../data/reference-problems.json";

type RefProblem = (typeof reference)["categories"][number]["subs"][number]["problems"][number];

// Returns null without writing anything if the user already has categories
export function seedReference(prisma: PrismaClient, userId: string) {
  return prisma.$transaction(
    async (tx) => {
      if ((await tx.category.count({ where: { userId } })) > 0) return null;

      const tagIds = new Map<string, string>();
      const tagNames = new Set(reference.categories.flatMap((m) => m.subs.flatMap((s) => s.problems.flatMap((p) => p.tags))));
      for (const name of tagNames) {
        const tag = await tx.tag.upsert({ where: { userId_name: { userId, name } }, create: { userId, name }, update: {} });
        tagIds.set(name, tag.id);
      }

      let problems = 0;
      for (const [mi, main] of reference.categories.entries()) {
        const mainRow = await tx.category.create({ data: { userId, name: main.name, position: mi } });
        for (const [si, sub] of main.subs.entries()) {
          const subRow = await tx.category.create({ data: { userId, name: sub.name, parentId: mainRow.id, position: si } });
          for (const [pi, p] of (sub.problems as RefProblem[]).entries()) {
            await tx.problem.create({
              data: {
                userId,
                categoryId: subRow.id,
                source: p.source as "LEETCODE" | "CUSTOM",
                number: p.number,
                title: p.title,
                difficulty: p.difficulty as "EASY" | "MEDIUM" | "HARD" | null,
                url: p.url,
                position: pi,
                tags: { connect: p.tags.map((t) => ({ id: tagIds.get(t)! })) },
              },
            });
            problems++;
          }
        }
      }
      return { categories: reference.categories.length, problems };
    },
    { timeout: 60_000 },
  );
}
