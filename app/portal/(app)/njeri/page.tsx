import { Suspense } from "react";
import type { Metadata } from "next";
import { PortalNjeri } from "@/components/portal-njeri";

export const metadata: Metadata = { title: "Njeri" };

export default function PortalNjeriPage() {
  return (
    <Suspense fallback={null}>
      <PortalNjeri />
    </Suspense>
  );
}
