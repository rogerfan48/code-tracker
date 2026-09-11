import { ApiError, fromDateString, handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { recordPatch } from "@/lib/validation";
import { serializeRecord } from "@/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnedRecord(userId: string, id: string) {
  const record = await prisma.practiceRecord.findFirst({ where: { id, problem: { userId } } });
  if (!record) throw new ApiError(404, "Record not found");
  return record;
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getOwnedRecord(user.id, id);
    const body = await parseBody(request, recordPatch);
    const record = await prisma.practiceRecord.update({
      where: { id },
      data: { date: fromDateString(body.date), level: body.level, note: body.note || null },
    });
    return json({ record: serializeRecord(record) });
  } catch (error) {
    return handleError("records/[id] PATCH", error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getOwnedRecord(user.id, id);
    await prisma.practiceRecord.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return handleError("records/[id] DELETE", error);
  }
}
