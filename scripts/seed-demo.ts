import { ensureTags, prisma, requireUserArg } from "./seed-lib";

const DEMO_MAIN = "Demo";

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

// [level, days ago] pairs, newest first; intervals default 0 / 90 / 30 / 14
const DEMO: { sub: string; problems: { source?: "CUSTOM"; number: string; title: string; difficulty: "EASY" | "MEDIUM" | "HARD" | null; url?: string | null; tags?: string[]; records: [number, number, string?][] }[] }[] = [
  {
    sub: "Due states",
    problems: [
      { number: "9001", title: "Never practiced (new)", difficulty: "EASY", records: [] },
      { number: "9002", title: "Level 0 last time (no re-practice)", difficulty: "EASY", records: [[0, 5], [2, 40]] },
      { number: "9003", title: "Level 1, due far in the future", difficulty: "MEDIUM", records: [[1, 10]] },
      { number: "9004", title: "Level 2, due in 2 days", difficulty: "MEDIUM", tags: ["Hash Table"], records: [[2, 28]] },
      { number: "9005", title: "Level 2, due today", difficulty: "MEDIUM", tags: ["Two Pointers"], records: [[2, 30], [3, 60]] },
      { number: "9006", title: "Level 3, overdue by 6 days", difficulty: "HARD", tags: ["Dynamic Programming", "Hash Table"], records: [[3, 20], [3, 45, "Still shaky on the transition"], [2, 90]] },
    ],
  },
  {
    sub: "Edge cases",
    problems: [
      { source: "CUSTOM", number: "KamaCode 999", title: "Custom problem without difficulty or url", difficulty: null, url: null, records: [[1, 3, "Solved on paper"]] },
      { source: "CUSTOM", number: "CF-1842B", title: "Custom problem with a url", difficulty: "HARD", url: "https://codeforces.com/problemset/problem/1842/B", tags: ["Bit Manipulation"], records: [[3, 1]] },
      { number: "9009", title: "Long history", difficulty: "MEDIUM", tags: ["Sliding Window"], records: [[1, 2], [1, 9], [2, 16], [2, 25], [3, 33], [3, 50], [3, 80], [2, 120]] },
      { number: "9010", title: "Practiced today", difficulty: "EASY", records: [[0, 0, "Fresh in mind"]] },
    ],
  },
];

async function remove(userId: string) {
  const main = await prisma.category.findFirst({ where: { userId, name: DEMO_MAIN, parentId: null }, include: { children: true } });
  if (!main) {
    console.log("No demo data found.");
    return;
  }
  const subIds = main.children.map((c) => c.id);
  const deleted = await prisma.problem.deleteMany({ where: { categoryId: { in: subIds } } });
  await prisma.category.deleteMany({ where: { id: { in: subIds } } });
  await prisma.category.delete({ where: { id: main.id } });
  console.log(`Removed demo category with ${deleted.count} problems.`);
}

async function create(userId: string) {
  const exists = await prisma.category.findFirst({ where: { userId, name: DEMO_MAIN, parentId: null } });
  if (exists) {
    console.error("Demo category already exists; run with --remove first.");
    process.exit(1);
  }
  const tagNames = [...new Set(DEMO.flatMap((s) => s.problems.flatMap((p) => p.tags ?? [])))];
  const tags = await ensureTags(userId, tagNames, { "Hash Table": "blue", "Two Pointers": "teal", "Dynamic Programming": "violet", "Bit Manipulation": "orange", "Sliding Window": "amber" });
  const mainCount = await prisma.category.count({ where: { userId, parentId: null } });
  const main = await prisma.category.create({ data: { userId, name: DEMO_MAIN, position: mainCount } });
  let count = 0;
  for (const [si, sub] of DEMO.entries()) {
    const subRow = await prisma.category.create({ data: { userId, name: sub.sub, parentId: main.id, position: si } });
    for (const [pi, p] of sub.problems.entries()) {
      await prisma.problem.create({
        data: {
          userId,
          categoryId: subRow.id,
          source: p.source ?? "LEETCODE",
          number: p.number,
          title: p.title,
          difficulty: p.difficulty,
          url: p.url === undefined ? `https://leetcode.com/problems/two-sum/` : p.url,
          position: pi,
          tags: { connect: (p.tags ?? []).map((t) => ({ id: tags.get(t)! })) },
          records: { create: p.records.map(([level, ago, note]) => ({ level, date: daysAgo(ago), note: note ?? null })) },
        },
      });
      count++;
    }
  }
  console.log(`Created demo category with ${count} problems for user ${userId}.`);
}

async function main() {
  const userId = requireUserArg();
  if (process.argv.includes("--remove")) await remove(userId);
  else await create(userId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
