import reference from "../data/reference-problems.json";
import { ensureTags, prisma, requireUserArg } from "./seed-lib";

type Ref = typeof reference;
type RefProblem = Ref["categories"][number]["subs"][number]["problems"][number];

async function main() {
  const userId = requireUserArg();
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) {
    console.error(`User ${userId} already has ${existing} categories; refusing to seed.`);
    process.exit(1);
  }

  const tagNames = [...new Set(reference.categories.flatMap((m) => m.subs.flatMap((s) => s.problems.flatMap((p) => p.tags))))];
  const tags = await ensureTags(userId, tagNames);

  let problems = 0;
  await prisma.$transaction(async (tx) => {
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
              tags: { connect: p.tags.map((t) => ({ id: tags.get(t)! })) },
            },
          });
          problems++;
        }
      }
    }
  }, { timeout: 60_000 });

  console.log(`Seeded ${reference.categories.length} main categories, ${problems} problems for user ${userId}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
