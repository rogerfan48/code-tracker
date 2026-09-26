import { ApiError, handleError, json } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { seedReference } from "@/lib/reference";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await seedReference(prisma, user.id);
    if (!result) throw new ApiError(409, "The reference list can only be added to an empty tree");
    return json(result, 201);
  } catch (error) {
    return handleError("reference POST", error);
  }
}
