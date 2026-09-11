import { auth } from "@/auth";
import { PORTFOLIO_URL } from "./env";

export const ALLOWED_ROLES = ["admin", "premium"] as const;

export type SessionUser = {
  id: string;
  role: string;
  name: string | null;
  email: string | null;
  image: string | null;
  allowed: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    role: user.role,
    name: user.name ?? null,
    email: user.email ?? null,
    // avatars uploaded on roger.tw are stored as site-relative paths
    image: user.image ? (user.image.startsWith("/") ? `${PORTFOLIO_URL}${user.image}` : user.image) : null,
    allowed: (ALLOWED_ROLES as readonly string[]).includes(user.role),
  };
}

export class AuthError extends Error {
  constructor(public status: 401 | 403) {
    super(status === 401 ? "Unauthorized" : "Forbidden");
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError(401);
  if (!user.allowed) throw new AuthError(403);
  return user;
}
