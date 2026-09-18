import type { Metadata } from "next";
import { CreatorOnboardingForm } from "@/components/creator-onboarding-form";

export const metadata: Metadata = {
  title: "Creator onboarding — Bantaba",
  description: "Complete your Bantaba creator profile.",
};

export default function CreatorOnboardingPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:px-8 sm:py-16">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <CreatorOnboardingForm />
      </section>
    </main>
  );
}
