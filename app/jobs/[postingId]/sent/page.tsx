import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getJobPostingHeadline } from "@/lib/firebase/content";
import { postingHref } from "@/lib/job-postings";

type Params = { params: Promise<{ postingId: string }> };

export const metadata: Metadata = {
  title: "Application sent",
  robots: { index: false, follow: false },
};

export default async function ApplicationSentPage({ params }: Params) {
  const { postingId } = await params;
  const headline = await getJobPostingHeadline(postingId);

  return <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-10 sm:py-16">
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="inline-flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bbdo-west-africa.png" alt="BBDO West Africa" className="h-7 w-auto object-contain dark:brightness-0 dark:invert" />
      </Link>
      <section className="mt-16 max-w-[52ch]">
        <h1 className="m-0 text-3xl font-bold tracking-tight sm:text-4xl">Application sent</h1>
        <p className="mb-0 mt-4 text-body text-muted-foreground">
          Thanks for applying{headline ? <> to <span className="font-semibold text-foreground">{headline}</span></> : null}. Your application is being reviewed, and we&apos;ll email you if you&apos;re shortlisted.
        </p>
        <p className="mb-0 mt-3 text-body text-muted-foreground">You can check its status any time in your account.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard/applications" className={buttonVariants({ size: "lg" })}>My applications</Link>
          <Link href={postingHref(postingId)} className={buttonVariants({ size: "lg", variant: "outline" })}>Back to the job</Link>
        </div>
      </section>
    </div>
  </main>;
}
