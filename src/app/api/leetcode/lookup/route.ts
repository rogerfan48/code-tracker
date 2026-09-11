import { ApiError, handleError, json } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { lookupLeetCode } from "@/lib/leetcode";

export async function GET(request: Request) {
  try {
    await requireUser();
    const number = new URL(request.url).searchParams.get("number")?.trim() ?? "";
    if (!/^\d+$/.test(number)) throw new ApiError(400, "number must be an integer");
    let result;
    try {
      result = await lookupLeetCode(number);
    } catch (error) {
      console.error("[API leetcode/lookup]", error);
      throw new ApiError(502, "LeetCode lookup failed; fill the fields manually");
    }
    if (!result) throw new ApiError(404, `LeetCode problem ${number} not found`);
    return json(result);
  } catch (error) {
    return handleError("leetcode/lookup GET", error);
  }
}
