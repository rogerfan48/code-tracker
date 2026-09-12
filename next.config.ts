import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["dev.code.roger.tw", "code.roger.tw", "localhost:3000"],
  // next/image is not used; disabling the optimizer removes the /_next/image endpoint from the attack surface
  images: { unoptimized: true },
  // PostHog reverse proxy under an unremarkable path so ad blockers don't drop analytics
  async rewrites() {
    return [
      { source: "/api/metrics/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/api/metrics/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
