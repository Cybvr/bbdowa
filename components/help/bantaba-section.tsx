import Link from "next/link";
import { SectionHeading } from "@/components/dashboard/ui";

const PROSE = "m-0 max-w-[70ch] text-[15px] leading-[1.5]";
const LINK = "text-foreground underline decoration-border underline-offset-4 hover:text-primary";

export const BANTABA_HEADINGS = ["What Bantaba is", "Who it's for", "Getting started"];

export function BantabaSection() {
  return (
    <div className="grid grid-cols-1 gap-8">
      <section>
        <SectionHeading>What Bantaba is</SectionHeading>
        <p className={PROSE}>
          Bantaba is BBDO West Africa&apos;s workspace: one place for jobs, tasks, time, messages and agency knowledge.
          A bantaba is the traditional gathering place, often a large meeting tree, where a community meets to talk,
          tell stories and decide things together. This is ours.
        </p>
      </section>

      <section>
        <SectionHeading>Who it&apos;s for</SectionHeading>
        <ul className="m-0 grid list-disc gap-2 pl-5 text-[15px] leading-[1.5]">
          <li><strong>The agency team</strong> runs jobs, assigns tasks and manages payments.</li>
          <li><strong>Creators and freelancers</strong> pick up tasks, log their time and get paid.</li>
          <li><strong>Clients</strong> follow their jobs, briefs and invoices in their own portal.</li>
        </ul>
      </section>

      <section>
        <SectionHeading>Getting started</SectionHeading>
        <ol className="m-0 grid list-decimal gap-2 pl-5 text-[15px] leading-[1.5]">
          <li>Sign in with Google, Microsoft or your email.</li>
          <li>Add your photo and details in <Link href="/dashboard/me" className={LINK}>your profile</Link>.</li>
          <li>Check <Link href="/dashboard/work" className={LINK}>Work</Link> for your tasks.</li>
          <li>Start the <Link href="/dashboard/tracker" className={LINK}>Tracker</Link> when you begin a task.</li>
          <li>Stuck? Ask <Link href="/dashboard/njeri" className={LINK}>Njeri</Link> or read the <Link href="/dashboard/help?tab=faqs" className={LINK}>FAQs</Link>.</li>
        </ol>
      </section>
    </div>
  );
}
