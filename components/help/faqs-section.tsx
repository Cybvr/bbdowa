import type { ReactNode } from "react";
import Link from "next/link";

const LINK = "text-foreground underline decoration-border underline-offset-4 hover:text-primary";

export const FAQS: { question: string; answer: ReactNode }[] = [
  { question: "I forgot my password.", answer: <>On the sign-in page, enter your email and tap <strong>Forgot password?</strong>. A reset link is sent to you.</> },
  { question: "Where are my tasks?", answer: <>In <Link href="/dashboard/work" className={LINK}>Work</Link>. Open a task to see the brief and change its status.</> },
  { question: "How do I log my hours?", answer: <>Start a timer in the <Link href="/dashboard/tracker" className={LINK}>Tracker</Link> when you begin, and stop it when you finish.</> },
  { question: "Where can I see my payments?", answer: <>In <Link href="/dashboard/payments" className={LINK}>Payments</Link>, with what&apos;s pending and what&apos;s paid.</> },
  { question: "How do I sign a document I've been sent?", answer: <>Open it from <Link href="/dashboard/work" className={LINK}>Work</Link>, read it, type your full name and sign.</> },
  { question: "How do I stop email notifications?", answer: <>Go to <Link href="/dashboard/settings" className={LINK}>Settings</Link> and switch off the email option. You&apos;ll still see everything in the dashboard.</> },
  { question: "How do I change my photo or details?", answer: <>Edit them in <Link href="/dashboard/me" className={LINK}>your profile</Link>.</> },
  { question: "Who do I ask if I'm stuck?", answer: <>Ask <Link href="/dashboard/njeri" className={LINK}>Njeri</Link> first, or message an admin from <Link href="/dashboard/messages" className={LINK}>Messages</Link>.</> },
];

export function FaqsSection() {
  return (
    <ul className="m-0 list-none divide-y divide-border border-y border-border p-0">
      {FAQS.map((faq) => (
        <li key={faq.question}>
          <details className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              {faq.question}
              <span aria-hidden="true" className="text-muted-foreground transition group-open:rotate-45">+</span>
            </summary>
            <p className="mb-0 mt-2 max-w-[70ch] text-[15px] leading-[1.5] text-muted-foreground">{faq.answer}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
