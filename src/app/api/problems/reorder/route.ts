import { ApiError, handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { problemReorder } from "@/lib/validation";
import { getOwnedSubCategory } from "@/lib/categories";

// orderedIds is the full new order of one sub category; ids currently living in another
// sub category are moved into it, which is how a cross-category drop is persisted.
export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const { categoryId, orderedIds } = await parseBody(request, problemReorder);
    await getOwnedSubCategory(user.id, categoryId);
    const owned = await prisma.problem.findMany({ where: { userId: user.id, id: { in: orderedIds } }, select: { id: true } });
    if (owned.length !== new Set(orderedIds).size) throw new ApiError(400, "Unknown problem id");
    const remaining = await prisma.problem.findMany({
      where: { userId: user.id, categoryId, id: { notIn: orderedIds } },
      select: { id: true },
    });
    if (remaining.length > 0) throw new ApiError(400, "orderedIds must include every problem of the category");
    await prisma.$transaction(
      orderedIds.map((id, position) => prisma.problem.update({ where: { id }, data: { categoryId, position } })),
    );
    return json({ ok: true });
  } catch (error) {
    return handleError("problems/reorder PUT", error);
  }
}
