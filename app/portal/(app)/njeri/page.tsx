import { Suspense } from "react";
import { PortalNjeri } from "@/components/portal-njeri";

export default function PortalNjeriPage() {
  return (
    <Suspense fallback={null}>
      <PortalNjeri />
    </Suspense>
  );
}
