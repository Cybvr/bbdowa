import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/ui";
import { ContractsView } from "@/components/contracts-view";

export const metadata: Metadata = { title: "Contracts" };

export default function ContractsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Contracts" description="NDAs and other agreements to review and sign." />
      <ContractsView />
    </main>
  );
}
