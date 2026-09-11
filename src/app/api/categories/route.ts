import { handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { categoryCreate } from "@/lib/validation";
import { getOwnedCategory, nextPosition } from "@/lib/categories";
import { serializeCategory } from "@/lib/serialize";
import { ApiError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody(request, categoryCreate);
    const parentId = body.parentId ?? null;
    if (parentId) {
      const parent = await getOwnedCategory(user.id, parentId);
      if (parent.parentId) throw new ApiError(400, "Only two category levels are supported");
    }
    const category = await prisma.category.create({
      data: { userId: user.id, name: body.name, parentId, position: await nextPosition({ userId: user.id, parentId }, "category") },
    });
    return json({ category: serializeCategory(category) }, 201);
  } catch (error) {
    return handleError("categories POST", error);
  }
}
