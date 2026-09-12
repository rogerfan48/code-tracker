import arcjet, { detectBot, fixedWindow, shield } from "@arcjet/next";

const isDev = process.env.NODE_ENV === "development";

// Same policy as roger.tw: shield (dry-run in dev because of Basic Auth + SSO redirects),
// bot detection with the usual allow-list, and a per-IP rate limit.
export const aj = process.env.ARCJET_KEY
  ? arcjet({
      key: process.env.ARCJET_KEY,
      characteristics: ["ip.src"],
      rules: [
        shield({ mode: isDev ? "DRY_RUN" : "LIVE" }),
        detectBot({
          mode: "LIVE",
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW", "CATEGORY:SOCIAL", "CATEGORY:AI"],
        }),
        fixedWindow({ mode: "LIVE", window: "60s", max: 100 }),
      ],
    })
  : null;
