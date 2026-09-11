import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function errorMessage(err: unknown, fallback = "Something went wrong") {
  return err instanceof Error && err.message ? err.message : fallback;
}
