import { seedReference } from "../src/lib/reference";
import { prisma, requireUserArg } from "./seed-lib";

async function main() {
  const userId = requireUserArg();
  const result = await seedReference(prisma, userId);
  if (!result) {
    console.error(`User ${userId} already has categories; refusing to seed.`);
    process.exit(1);
  }
  console.log(`Seeded ${result.categories} main categories, ${result.problems} problems for user ${userId}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
