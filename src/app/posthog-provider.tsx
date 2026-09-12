"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const enabled = Boolean(KEY) && process.env.NODE_ENV !== "development";

function PageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    posthog.capture("$pageview", { $current_url: window.origin + pathname + (query ? `?${query}` : "") });
  }, [pathname, searchParams]);
  return null;
}

export interface VisitorFlags {
  isp?: string;
  isBot?: boolean;
  isVpn?: boolean;
  isHosting?: boolean;
}

export function PostHogProvider({ children, flags, user }: { children: React.ReactNode; flags: VisitorFlags; user?: { id: string; email: string | null; name: string | null } | null }) {
  useEffect(() => {
    if (!enabled) return;
    posthog.init(KEY!, {
      api_host: "/api/metrics", // same-origin reverse proxy (see next.config.ts rewrites)
      ui_host: "https://us.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      autocapture: false,
      capture_performance: false,
      disable_session_recording: true,
      enable_heatmaps: false,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (user?.id) posthog.identify(user.id, { email: user.email, name: user.name });
  }, [user?.id, user?.email, user?.name]);

  useEffect(() => {
    if (!enabled) return;
    posthog.register({ isp: flags.isp, is_bot: flags.isBot, is_vpn: flags.isVpn, is_hosting: flags.isHosting });
  }, [flags.isp, flags.isBot, flags.isVpn, flags.isHosting]);

  if (!enabled) return <>{children}</>;
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
