import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["dev.code.roger.tw", "code.roger.tw", "localhost:3000"],
  // next/image is not used; disabling the optimizer removes the /_next/image endpoint from the attack surface
  images: { unoptimized: true },
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
