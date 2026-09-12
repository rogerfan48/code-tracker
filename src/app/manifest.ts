import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// SITE.url / indexable come from AUTH_URL, which is only set at runtime (not in the Docker build)
export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/problems",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#4f46e5",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
  };
}
