import { ApiError } from "./api";
import { prisma } from "./prisma";

export async function getOwnedCategory(userId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw new ApiError(404, "Category not found");
  return category;
}

export async function getOwnedSubCategory(userId: string, id: string) {
  const category = await getOwnedCategory(userId, id);
  if (!category.parentId) throw new ApiError(400, "Problems must belong to a sub category");
  return category;
}

export async function nextPosition(where: { userId: string; parentId?: string | null; categoryId?: string }, table: "category" | "problem") {
  const agg =
    table === "category"
      ? await prisma.category.aggregate({ where: { userId: where.userId, parentId: where.parentId ?? null }, _max: { position: true } })
      : await prisma.problem.aggregate({ where: { userId: where.userId, categoryId: where.categoryId }, _max: { position: true } });
  return (agg._max.position ?? -1) + 1;
}
