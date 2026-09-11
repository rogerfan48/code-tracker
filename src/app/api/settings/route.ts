import { handleError, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { settingsPut } from "@/lib/validation";
import { loadSettings } from "@/lib/serialize";

export async function GET() {
  try {
    const user = await requireUser();
    return json({ settings: await loadSettings(user.id) });
  } catch (error) {
    return handleError("settings GET", error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const { intervals, soonDays } = await parseBody(request, settingsPut);
    const data = { interval0: intervals[0], interval1: intervals[1], interval2: intervals[2], interval3: intervals[3], soonDays };
    await prisma.userSettings.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
    return json({ settings: { intervals, soonDays } });
  } catch (error) {
    return handleError("settings PUT", error);
  }
}
