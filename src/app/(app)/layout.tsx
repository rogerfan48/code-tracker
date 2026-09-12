import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { loginUrl } from "@/lib/env";
import { loadBootstrap } from "@/lib/serialize";
import { TrackerProvider } from "@/components/tracker/tracker-provider";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    const path = (await headers()).get("x-pathname") ?? "/problems";
    redirect(loginUrl(path));
  }
  if (!user.allowed) redirect("/?restricted=1");

  const initial = await loadBootstrap(user.id);
  return (
    <TrackerProvider initial={initial}>
      <AppShell user={user}>{children}</AppShell>
    </TrackerProvider>
  );
}
