import "dotenv/config";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

export function requireUserArg(): string {
  const user = argValue("--user");
  if (!user) {
    console.error("Usage: --user <portfolio User.id>");
    process.exit(1);
  }
  return user;
}

export async function ensureTags(userId: string, names: string[], colors: Record<string, string> = {}) {
  const map = new Map<string, string>();
  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name, color: colors[name] ?? "gray" },
      update: {},
    });
    map.set(name, tag.id);
  }
  return map;
}
