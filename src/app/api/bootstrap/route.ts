import { handleError, json } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { loadBootstrap } from "@/lib/serialize";

export async function GET() {
  try {
    const user = await requireUser();
    return json(await loadBootstrap(user.id));
  } catch (error) {
    return handleError("bootstrap", error);
  }
}
