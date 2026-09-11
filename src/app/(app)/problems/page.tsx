import { Suspense } from "react";
import type { Metadata } from "next";
import { ProblemsView } from "@/components/tracker/problems-view";

export const metadata: Metadata = { title: "Problems" };

export default function ProblemsPage() {
  return (
    <Suspense>
      <ProblemsView />
    </Suspense>
  );
}
