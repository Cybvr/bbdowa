import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding-flow";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Set up your Bantaba profile.",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:px-8 sm:py-16">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <OnboardingFlow />
      </section>
    </main>
  );
}
