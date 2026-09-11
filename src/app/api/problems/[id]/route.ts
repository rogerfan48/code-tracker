import { Prisma } from "@prisma/client";
import { ApiError, handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { problemInput } from "@/lib/validation";
import { getOwnedSubCategory, nextPosition } from "@/lib/categories";
import { connectTags, getOwnedProblem } from "@/lib/problems";
import { problemInclude, serializeProblem } from "@/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const current = await getOwnedProblem(user.id, id);
    const body = await parseBody(request, problemInput);
    const moved = body.categoryId !== current.categoryId;
    if (moved) await getOwnedSubCategory(user.id, body.categoryId);
    try {
      const problem = await prisma.problem.update({
        where: { id },
        data: {
          categoryId: body.categoryId,
          source: body.source,
          number: body.number,
          title: body.title,
          difficulty: body.difficulty,
          url: body.url,
          position: moved ? await nextPosition({ userId: user.id, categoryId: body.categoryId }, "problem") : current.position,
          tags: { set: await connectTags(user.id, body.tagNames) },
        },
        include: problemInclude,
      });
      return json({ problem: serializeProblem(problem) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(409, `Another problem already uses number ${body.number}`);
      }
      throw error;
    }
  } catch (error) {
    return handleError("problems/[id] PATCH", error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getOwnedProblem(user.id, id);
    await prisma.problem.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return handleError("problems/[id] DELETE", error);
  }
}
