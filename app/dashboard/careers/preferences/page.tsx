import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Apply" };

export default function LegacyCareersPreferencesPage() {
  redirect("/dashboard/careers/apply");
}
