import type { Metadata } from "next";
import { ProjectsTable } from "@/components/projects-table";
import { PROJECTS } from "@/lib/projects";
import { PageHeader } from "@/components/dashboard/ui";

export const metadata: Metadata = {
  title: "Projects",
  description: "Browse live and completed BBDO West Africa projects.",
};

export default function ProjectsPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Projects" description="Client work: fee, target and result on every job." />
      <ProjectsTable projects={PROJECTS} />
    </main>
  );
}
