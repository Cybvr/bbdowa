import type { Metadata } from "next";
import { PodDirectory } from "@/components/pod-directory";
import { POD, POD_DISCIPLINES } from "@/lib/pod";

export const metadata: Metadata = {
  title: "Pod",
  description: "External talent we can call on when a job needs them.",
};

export default function PodPage() {
  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-[100px] pt-[clamp(48px,7vw,96px)]">
      <div className="mb-[clamp(40px,6vw,72px)] flex items-end justify-between gap-8 max-[720px]:flex-col max-[720px]:items-start">
        <h1 className="m-0 text-[clamp(64px,13vw,180px)] uppercase leading-[0.82] tracking-[-0.07em]">
          Pod
        </h1>
        <p className="mb-2 mt-0 max-w-[28ch] text-[clamp(18px,2vw,26px)] leading-[1.2]">
          External talent we call on when a job needs them. Not staff.
        </p>
      </div>

      <PodDirectory talents={POD} disciplines={POD_DISCIPLINES} />
    </main>
  );
}
