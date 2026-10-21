import type { Metadata } from "next";
import { AdminApplicants } from "@/components/admin-applicants";

export const metadata: Metadata = { title: "Applicants" };

export default function AdminApplicantsPage() {
  return <AdminApplicants />;
}
