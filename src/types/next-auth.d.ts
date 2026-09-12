import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; role: string; codeTrackerAccess: boolean; username: string | null };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    codeTrackerAccess?: boolean;
    username?: string;
  }
}
