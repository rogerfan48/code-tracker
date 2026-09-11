import { ApiError, handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { categoryPatch } from "@/lib/validation";
import { getOwnedCategory } from "@/lib/categories";
import { serializeCategory } from "@/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getOwnedCategory(user.id, id);
    const body = await parseBody(request, categoryPatch);
    const category = await prisma.category.update({ where: { id }, data: { name: body.name } });
    return json({ category: serializeCategory(category) });
  } catch (error) {
    return handleError("categories/[id] PATCH", error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getOwnedCategory(user.id, id);
    const [children, problems] = await Promise.all([
      prisma.category.count({ where: { parentId: id } }),
      prisma.problem.count({ where: { categoryId: id } }),
    ]);
    if (children > 0) throw new ApiError(400, "Delete or move its sub categories first");
    if (problems > 0) throw new ApiError(400, "Delete or move its problems first");
    await prisma.category.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return handleError("categories/[id] DELETE", error);
  }
}
