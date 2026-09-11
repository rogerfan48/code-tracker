import { Prisma } from "@prisma/client";
import { ApiError, handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { problemInput } from "@/lib/validation";
import { getOwnedSubCategory, nextPosition } from "@/lib/categories";
import { connectTags } from "@/lib/problems";
import { problemInclude, serializeProblem } from "@/lib/serialize";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody(request, problemInput);
    await getOwnedSubCategory(user.id, body.categoryId);
    try {
      const problem = await prisma.problem.create({
        data: {
          userId: user.id,
          categoryId: body.categoryId,
          source: body.source,
          number: body.number,
          title: body.title,
          difficulty: body.difficulty,
          url: body.url,
          position: await nextPosition({ userId: user.id, categoryId: body.categoryId }, "problem"),
          tags: { connect: await connectTags(user.id, body.tagNames) },
        },
        include: problemInclude,
      });
      return json({ problem: serializeProblem(problem) }, 201);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(409, `A ${body.source === "LEETCODE" ? "LeetCode" : "custom"} problem with number ${body.number} already exists`);
      }
      throw error;
    }
  } catch (error) {
    return handleError("problems POST", error);
  }
}
