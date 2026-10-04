import Link from "next/link";
import { SectionHeading } from "@/components/dashboard/ui";

const TOPICS = [
  {
    title: "Work",
    href: "/dashboard/work",
    body: "Your tasks and the documents waiting on you. Open a task to see the brief, links and due date, and mark it done when it is delivered.",
  },
  {
    title: "Tracker",
    href: "/dashboard/tracker",
    body: "Start a timer against a job when you begin something, and pause or stop it from the sidebar. Your hours roll up into the weekly view.",
  },
  {
    title: "Njeri",
    href: "/dashboard/njeri",
    body: "The workspace assistant. Ask about jobs, people or your tasks, and confirm any change it proposes before it is saved.",
  },
  {
    title: "Messages",
    href: "/dashboard/messages",
    body: "Direct messages with anyone who has an account. Use the plus button to start a conversation.",
  },
  {
    title: "The Studio",
    href: "/dashboard/discover",
    body: "Creators, clients, workflows, brand assets and resources, all in one menu in the sidebar.",
  },
  {
    title: "Your profile",
    href: "/dashboard/me",
    body: "Keep your name, photo and contact details up to date so people can find you. Account options are under Settings.",
  },
];

export function GeneralSection() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((topic) => (
          <section key={topic.title}>
            <SectionHeading>
              <Link href={topic.href} className="text-inherit no-underline hover:text-primary focus-visible:text-primary">
                {topic.title}
              </Link>
            </SectionHeading>
            <p className="m-0 max-w-[42ch] text-[15px] leading-[1.5]">{topic.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-10">
        <SectionHeading>Still stuck?</SectionHeading>
        <p className="m-0 max-w-[60ch] text-[15px] leading-[1.5]">
          Ask Njeri first, or send a message to an admin from <Link href="/dashboard/messages" className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">Messages</Link>.
        </p>
      </section>
    </div>
  );
}
