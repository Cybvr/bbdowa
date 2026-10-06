import { Suspense } from "react";
import { PostJobSteps } from "@/components/portal-job-brief";

export default function PortalNewJobPage() {
  return (
    <Suspense fallback={null}>
      <PostJobSteps />
    </Suspense>
  );
}
