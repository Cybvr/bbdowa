import type { Metadata } from "next";
import { ProjectsTable } from "@/components/projects-table";
import { PROJECTS } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Browse live and completed BBDO West Africa projects.",
};

export default function ProjectsPage() {
  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-24 pt-[clamp(42px,6vw,82px)]">
      <header className="border-b-2 border-foreground pb-[clamp(26px,4vw,44px)]">
        <h1 className="m-0 text-[clamp(38px,5vw,64px)] uppercase leading-[0.92] tracking-[-0.045em]">
          Projects
        </h1>
      </header>
      <ProjectsTable projects={PROJECTS} />
    </main>
  );
}
