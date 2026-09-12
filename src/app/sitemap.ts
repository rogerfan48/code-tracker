import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// SITE.url / indexable come from AUTH_URL, which is only set at runtime (not in the Docker build)
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE.url, changeFrequency: "monthly", priority: 1 }];
}
