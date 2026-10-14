import Link from "next/link";
import { SectionHeading } from "@/components/dashboard/ui";

/** One short article per Bantaba feature. */
export const FEATURES = [
  {
    title: "Work",
    href: "/dashboard/work",
    body: "Your tasks and the documents waiting on you. Open a task to see the brief, links and due date, and mark it done when it is delivered.",
  },
  {
    title: "My jobs",
    href: "/dashboard/my-jobs",
    body: "The client jobs you're on. Open one to see the brief, the team and its tasks, and to log your time against it.",
  },
  {
    title: "Tracker",
    href: "/dashboard/tracker",
    body: "Start a timer against a job when you begin something, and pause or stop it from the sidebar. Your hours roll up into the weekly view.",
  },
  {
    title: "Messages",
    href: "/dashboard/messages",
    body: "Direct messages with anyone who has an account. Use the plus button to start a conversation.",
  },
  {
    title: "Njeri",
    href: "/dashboard/njeri",
    body: "The workspace assistant. Ask about jobs, people or your tasks, and confirm any change it proposes before it is saved.",
  },
  {
    title: "The Studio",
    href: "/dashboard/discover",
    body: "Creators and appraisals, all in one menu in the sidebar.",
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    body: "What you're owed for your work and whether it has been paid.",
  },
  {
    title: "Your profile",
    href: "/dashboard/me",
    body: "Keep your name, photo and contact details up to date so people can find you. Account options are under Settings.",
  },
];

export function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 gap-y-6">
      {FEATURES.map((feature) => (
        <section key={feature.title}>
          <SectionHeading>
            <Link href={feature.href} className="text-inherit no-underline hover:text-primary focus-visible:text-primary">
              {feature.title}
            </Link>
          </SectionHeading>
          <p className="m-0 max-w-[70ch] text-[15px] leading-[1.5]">{feature.body}</p>
        </section>
      ))}
    </div>
  );
}
