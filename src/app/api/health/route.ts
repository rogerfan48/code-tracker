import { json } from "@/lib/api";

export function GET() {
  return json({ ok: true });
}
