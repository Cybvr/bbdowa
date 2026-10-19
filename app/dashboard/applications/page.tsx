import type { Metadata } from "next";
import { MyApplications } from "@/components/my-applications";

export const metadata: Metadata = { title: "My applications" };

export default function MyApplicationsPage() {
  return <MyApplications />;
}
