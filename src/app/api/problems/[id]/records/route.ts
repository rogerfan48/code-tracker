import { fromDateString, handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { recordCreate } from "@/lib/validation";
import { getOwnedProblem } from "@/lib/problems";
import { serializeRecord } from "@/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getOwnedProblem(user.id, id);
    const body = await parseBody(request, recordCreate);
    const record = await prisma.practiceRecord.create({
      data: { problemId: id, date: fromDateString(body.date), level: body.level, note: body.note || null },
    });
    return json({ record: serializeRecord(record) }, 201);
  } catch (error) {
    return handleError("problems/[id]/records POST", error);
  }
}
