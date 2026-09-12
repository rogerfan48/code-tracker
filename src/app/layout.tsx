import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { SITE } from "@/lib/site";
import { getSessionUser } from "@/lib/session";
import { PostHogProvider } from "./posthog-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

const title = `${SITE.name} | ${SITE.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  keywords: ["LeetCode", "spaced repetition", "coding interview", "practice tracker", "algorithms", "Roger Fan", "roger.tw"],
  authors: [SITE.author],
  creator: SITE.author.name,
  publisher: SITE.author.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title, description: SITE.description },
  robots: SITE.indexable ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { email: false, telephone: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [h, user] = await Promise.all([headers(), getSessionUser()]);
  const flags = {
    isp: h.get("x-arcjet-isp") ?? undefined,
    isBot: h.get("x-arcjet-is-bot") === "true",
    isVpn: h.get("x-arcjet-is-vpn") === "true",
    isHosting: h.get("x-arcjet-is-hosting") === "true",
  };
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <PostHogProvider flags={flags} user={user ? { id: user.id, email: user.email, name: user.name } : null}>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </PostHogProvider>
      </body>
    </html>
  );
}
