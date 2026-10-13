import type { Metadata } from "next";
import { JobsTable } from "@/components/jobs-table";
import { getJobs } from "@/lib/firebase/content";
import { DashboardListPage } from "@/components/dashboard/list-page";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Every client job, with its tasks, timesheets and payments.",
};

export default async function AdminJobsPage() {
  const jobs = await getJobs();

  return (
    <DashboardListPage title="Jobs">
      <JobsTable jobs={jobs} createType="job" />
    </DashboardListPage>
  );
}
