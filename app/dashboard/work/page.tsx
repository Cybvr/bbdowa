import type { Metadata } from "next";
import { redirect } from "next/navigation";
import WorkClient from "./work-client";
import { getTaskById } from "@/lib/firebase/content";

type WorkPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const WORK_DESCRIPTION = "View and manage your tasks across BBDO West Africa.";

export async function generateMetadata({ searchParams }: WorkPageProps): Promise<Metadata> {
  const params = await searchParams;
  const taskParam = params.task;
  const taskId = Array.isArray(taskParam) ? taskParam[0] : taskParam;

  if (!taskId) {
    return {
      title: "Tasks",
      description: WORK_DESCRIPTION,
      openGraph: {
        title: "Tasks | BBDO West Africa",
        description: WORK_DESCRIPTION,
        type: "website",
        url: "/dashboard/work",
      },
      twitter: { card: "summary", title: "Tasks | BBDO West Africa", description: WORK_DESCRIPTION },
    };
  }

  try {
    const task = await getTaskById(taskId);
    if (task) {
      const description = task.description?.trim() || "Open this shared task in BBDO West Africa.";
      const shareUrl = `/dashboard/work/${encodeURIComponent(taskId)}?shared=1`;
      return {
        title: task.title,
        description,
        openGraph: {
          title: `${task.title} | BBDO West Africa`,
          description,
          type: "website",
          url: shareUrl,
        },
        twitter: {
          card: "summary",
          title: `${task.title} | BBDO West Africa`,
          description,
        },
      };
    }
  } catch (error) {
    console.error("Unable to load task metadata", error);
  }

  return {
    title: "Shared task",
    description: "Open a shared task in BBDO West Africa.",
    openGraph: {
      title: "Shared task | BBDO West Africa",
      description: "Open a shared task in BBDO West Africa.",
      type: "website",
      url: `/dashboard/work/${encodeURIComponent(taskId)}`,
    },
  };
}

export default async function WorkPage({ searchParams }: WorkPageProps) {
  const params = await searchParams;
  const taskParam = params.task;
  const taskId = Array.isArray(taskParam) ? taskParam[0] : taskParam;
  if (taskId) {
    const shared = params.shared === "1" || (Array.isArray(params.shared) && params.shared.includes("1"));
    redirect(`/dashboard/work/${encodeURIComponent(taskId)}${shared ? "?shared=1" : ""}`);
  }
  return <WorkClient />;
}
