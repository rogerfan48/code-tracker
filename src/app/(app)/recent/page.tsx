import type { Metadata } from "next";
import { RecentView } from "@/components/tracker/recent-view";

export const metadata: Metadata = { title: "Recent" };

export default function RecentPage() {
  return <RecentView />;
}
