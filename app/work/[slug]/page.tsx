import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { RichTextContent } from "@/components/rich-text-editor";
import { getJobBySlug } from "@/lib/firebase/content";
import { jobDisplayTitle } from "@/lib/jobs";

type WorkPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job || job.status === "archived") {
    notFound();
  }

  const title = jobDisplayTitle(job);

  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-primary px-[clamp(20px,5vw,72px)] pb-[clamp(36px,6vw,72px)] pt-[clamp(32px,5vw,64px)] text-white">
          <Link
            href="/#work"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/75 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Back to work
          </Link>
          <p className="mb-0 mt-14 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">
            {job.name} / {job.category}
          </p>
          <h1 className="mb-0 mt-6 max-w-[11ch] text-[clamp(52px,10vw,150px)] uppercase leading-[0.84] tracking-[-0.06em]">
            {title}
          </h1>
        </section>

        <section className="px-[clamp(20px,5vw,72px)] py-[clamp(28px,5vw,64px)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={job.image}
            alt={job.imageAlt}
            className="aspect-[16/9] w-full rounded-xl bg-foreground object-cover"
          />
        </section>

        <section className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-x-[clamp(28px,8vw,128px)] gap-y-12 border-t border-foreground px-[clamp(20px,5vw,72px)] py-[clamp(56px,9vw,128px)] max-[820px]:grid-cols-1">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">The brief</p>
          <div className="max-w-[58ch]">
            <RichTextContent value={job.summary} className="text-[clamp(28px,4vw,56px)] uppercase leading-[0.94] tracking-[-0.05em] [&_p]:mb-5" />
            <dl className="m-0 mt-14 grid gap-8 border-t border-foreground pt-8 text-[17px] leading-[1.5]">
              <div className="grid gap-3 sm:grid-cols-[minmax(120px,0.3fr)_minmax(0,1fr)]">
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Challenge</dt>
                <dd className="m-0">{job.challenge}</dd>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(120px,0.3fr)_minmax(0,1fr)]">
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Strategy</dt>
                <dd className="m-0">{job.strategy}</dd>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(120px,0.3fr)_minmax(0,1fr)]">
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Outcome</dt>
                <dd className="m-0">{job.outcome}</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
