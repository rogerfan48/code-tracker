import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AuthError } from "./session";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleError(scope: string, error: unknown) {
  if (error instanceof AuthError) return json({ error: error.message }, error.status);
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const path = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return json({ error: `${path}${issue?.message ?? "Invalid input"}` }, 400);
  }
  console.error(`[API ${scope}]`, error);
  return json({ error: "Internal error" }, 500);
}

// Largest legitimate payload is a reorder list of a few hundred ids; anything bigger is abuse
const MAX_BODY_BYTES = 64 * 1024;

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) throw new ApiError(413, "Request body too large");
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) throw new ApiError(413, "Request body too large");
    body = JSON.parse(text);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Invalid JSON body");
  }
  return schema.parse(body);
}

export function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

// DATE columns come back as UTC midnight; build them the same way so they round-trip
export function fromDateString(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
