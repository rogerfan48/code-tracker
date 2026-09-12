import { NextResponse, type NextRequest } from "next/server";
import { aj } from "@/lib/arcjet";

const POSTHOG_CAPTURE = "https://us.i.posthog.com/capture/";

function capture(event: string, properties: Record<string, unknown>) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || process.env.NODE_ENV === "development") return Promise.resolve();
  return fetch(POSTHOG_CAPTURE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, event, properties }),
  }).catch((e) => console.error("PostHog capture failed", e));
}

function isPrefetch(req: NextRequest) {
  if (req.method !== "GET") return false;
  const purpose = `${req.headers.get("purpose") ?? ""} ${req.headers.get("sec-purpose") ?? ""}`;
  return Boolean(
    req.headers.get("next-router-prefetch") ||
      req.headers.get("next-router-segment-prefetch") ||
      purpose.includes("prefetch") ||
      (req.headers.get("sec-fetch-dest") === "empty" && req.headers.get("sec-fetch-mode") === "cors" && !req.nextUrl.pathname.startsWith("/api")),
  );
}

function isLocalNetwork(host: string, ip: string) {
  return (
    /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(host) ||
    host.endsWith(".local") ||
    /^(192\.168\.|10\.|127\.)/.test(ip)
  );
}

export async function proxy(req: NextRequest) {
  // Layouts can't read the request path, so forward it for the login redirect's callbackUrl.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname + req.nextUrl.search);
  const next = (init?: ResponseInit) => NextResponse.next({ ...init, request: { headers: requestHeaders } });

  const pathname = req.nextUrl.pathname.toLowerCase();
  // Scanner noise (PHP / WordPress / dotfiles): 404 without spending Arcjet quota
  if (/\.(php|env|git|sql|bak|config)$/.test(pathname) || /(^\/|\/)(wp-admin|wp-content|wp-includes|\.git)(\/|$)/.test(pathname)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const host = req.headers.get("host") ?? "";
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  if (!aj || isPrefetch(req) || isLocalNetwork(host, ip)) return next();

  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      const botOnly = decision.results.some((r) => r.reason.isBot() && r.conclusion === "DENY");
      // The landing and SEO files are public: let unknown bots read them. Everything else blocks.
      const publicPage = !pathname.startsWith("/api/") && !/^\/(problems|due|recent|stats|settings)/.test(pathname);
      if (!(botOnly && publicPage)) {
        await capture("security_denied", {
          distinct_id: ip || "unknown_ip",
          $ip: ip,
          reason: decision.reason,
          country: decision.ip?.country,
          city: decision.ip?.city,
          isp: decision.ip?.asnName,
          is_bot: decision.results.some((r) => r.reason.isBot()),
          is_vpn: decision.ip?.isVpn(),
          url: req.url,
          user_agent: req.headers.get("user-agent"),
        });
        return NextResponse.json({ error: "Forbidden", reason: decision.reason }, { status: 403 });
      }
    }

    const isBot = decision.results.some((r) => r.reason.isBot());
    const ua = req.headers.get("user-agent") ?? "";
    // Declared bots never run client JS, so their pageviews are recorded here; browsers report themselves.
    if (isBot && !decision.isDenied() && /bot|crawl|spider|slurp|monitor|preview|facebook|whatsapp|headless/i.test(ua)) {
      void capture("$pageview", {
        distinct_id: ip,
        $ip: ip,
        $current_url: req.url,
        country: decision.ip?.country,
        city: decision.ip?.city,
        isp: decision.ip?.asnName,
        is_bot: true,
        bot_type: "allowed_bot",
        user_agent: ua,
      });
    }

    const response = next();
    if (decision.ip.asnName) response.headers.set("x-arcjet-isp", decision.ip.asnName);
    if (isBot) response.headers.set("x-arcjet-is-bot", "true");
    if (decision.ip.isVpn()) response.headers.set("x-arcjet-is-vpn", "true");
    if (decision.ip.isHosting()) response.headers.set("x-arcjet-is-hosting", "true");
    return response;
  } catch (error) {
    // fail open: never let the security service take the site down
    console.error("Arcjet error:", error);
    return next();
  }
}

export const config = {
  // skip static assets, the session poll, and the PostHog reverse proxy
  matcher: ["/((?!api/auth/session|api/metrics|_next|icon\\.svg|apple-icon|opengraph-image|[^?]*\\.(?:css|js|png|jpe?g|webp|svg|ico|woff2?|webmanifest|txt|xml)).*)"],
};
