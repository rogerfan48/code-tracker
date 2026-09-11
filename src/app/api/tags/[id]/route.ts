import { Prisma } from "@prisma/client";
import { ApiError, handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { tagPatch } from "@/lib/validation";
import { serializeTag } from "@/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnedTag(userId: string, id: string) {
  const tag = await prisma.tag.findFirst({ where: { id, userId } });
  if (!tag) throw new ApiError(404, "Tag not found");
  return tag;
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getOwnedTag(user.id, id);
    const body = await parseBody(request, tagPatch);
    try {
      const tag = await prisma.tag.update({ where: { id }, data: body });
      return json({ tag: serializeTag(tag) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "Tag already exists");
      throw error;
    }
  } catch (error) {
    return handleError("tags/[id] PATCH", error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getOwnedTag(user.id, id);
    await prisma.tag.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return handleError("tags/[id] DELETE", error);
  }
}
