import type { Metadata } from "next";
import { JobsTable } from "@/components/jobs-table";
import { getJobs, getClients } from "@/lib/firebase/content";
import { DashboardListPage } from "@/components/dashboard/list-page";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Every client job, with its tasks, timesheets and payments.",
};

export default async function AdminJobsPage() {
  const [jobs, clients] = await Promise.all([getJobs(), getClients()]);

  return (
    <DashboardListPage title="Jobs" createType="job">
      <JobsTable jobs={jobs} clients={clients} />
    </DashboardListPage>
  );
}
