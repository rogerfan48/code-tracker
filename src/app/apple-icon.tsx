import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, padding: "0 0 34px", background: "#f7f7f5", borderRadius: 40 }}>
        <div style={{ width: 28, height: 50, borderRadius: 10, background: "#9ca3af" }} />
        <div style={{ width: 28, height: 112, borderRadius: 10, background: "#4f46e5" }} />
        <div style={{ width: 28, height: 78, borderRadius: 10, background: "#d97706" }} />
      </div>
    ),
    size,
  );
}
