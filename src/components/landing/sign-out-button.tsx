"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ children }: { children: React.ReactNode }) {
  return (
    <Button size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
      {children}
    </Button>
  );
}
