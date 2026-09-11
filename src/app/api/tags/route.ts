import { Prisma } from "@prisma/client";
import { ApiError, handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { tagCreate } from "@/lib/validation";
import { serializeTag } from "@/lib/serialize";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody(request, tagCreate);
    try {
      const tag = await prisma.tag.create({ data: { userId: user.id, name: body.name, color: body.color ?? "gray" } });
      return json({ tag: serializeTag(tag) }, 201);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "Tag already exists");
      throw error;
    }
  } catch (error) {
    return handleError("tags POST", error);
  }
}
