import { ApiError, handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { categoryReorder } from "@/lib/validation";

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const { parentId, orderedIds } = await parseBody(request, categoryReorder);
    const siblings = await prisma.category.findMany({ where: { userId: user.id, parentId }, select: { id: true } });
    const known = new Set(siblings.map((s) => s.id));
    if (orderedIds.length !== known.size || orderedIds.some((id) => !known.has(id))) {
      throw new ApiError(400, "orderedIds must list every sibling exactly once");
    }
    await prisma.$transaction(orderedIds.map((id, position) => prisma.category.update({ where: { id }, data: { position } })));
    return json({ ok: true });
  } catch (error) {
    return handleError("categories/reorder PUT", error);
  }
}
