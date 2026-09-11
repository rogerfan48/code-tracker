import type { Metadata } from "next";
import { StatsView } from "@/components/tracker/stats-view";

export const metadata: Metadata = { title: "Stats" };

export default function StatsPage() {
  return <StatsView />;
}
