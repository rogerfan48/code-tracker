import type { Metadata } from "next";
import { DueView } from "@/components/tracker/due-view";

export const metadata: Metadata = { title: "Due" };

export default function DuePage() {
  return <DueView />;
}
