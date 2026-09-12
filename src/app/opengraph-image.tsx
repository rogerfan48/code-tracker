import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const bars = [
  { h: 90, c: "#9ca3af" },
  { h: 200, c: "#4f46e5" },
  { h: 140, c: "#d97706" },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f7f7f5", padding: 80, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginRight: 72 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ width: 44, height: b.h, borderRadius: 14, background: b.c }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700, letterSpacing: -3, color: "#18181b" }}>
            Code<span style={{ color: "#4f46e5" }}>Tracker</span>
          </div>
          <div style={{ fontSize: 40, color: "#3f3f46", marginTop: 18 }}>{SITE.tagline}</div>
          <div style={{ fontSize: 28, color: "#71717a", marginTop: 44 }}>code.roger.tw</div>
        </div>
      </div>
    ),
    size,
  );
}
