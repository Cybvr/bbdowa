import Link from "next/link";
import { PROJECTS, sortProjectsByLatestLive } from "@/lib/projects";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ContactForm } from "./contact-form";

const RECORD = [
  { value: "10", label: "Years in market" },
  { value: "100+", label: "Brands served" },
  { value: "30+", label: "People in Lagos" },
];

const WORK = sortProjectsByLatestLive(
  PROJECTS.filter((project) => project.status !== "pitch"),
).slice(0, 8);

export default function MarketingHomePage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <section
          aria-labelledby="welcome"
          className="px-[clamp(20px,5vw,72px)] pb-[clamp(28px,4vw,44px)] pt-[clamp(24px,4vw,56px)]"
        >
          <h1 id="welcome" className="sr-only">
            Akwaaba
          </h1>
          <video
            src="/media/hero.mp4"
            poster="/media/projects/google/know-google-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            className="aspect-video w-full rounded-xl object-cover max-[640px]:aspect-[4/3]"
          />
        </section>

        <section
          aria-labelledby="introduction"
          className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-x-[clamp(24px,4vw,56px)] gap-y-8 border-b border-foreground px-[clamp(20px,4vw,56px)] py-[clamp(36px,5vw,64px)] max-[760px]:grid-cols-1"
        >
          <h2 id="introduction" className="sr-only">
            BBDO West Africa
          </h2>
          <p className="m-0 max-w-[18ch] text-[clamp(24px,3.4vw,44px)] font-medium uppercase leading-[1.02] tracking-[-0.045em]">
            We make work that moves business, culture and people.
          </p>

          <dl className="m-0 grid grid-cols-3 gap-x-[clamp(14px,2.5vw,32px)] gap-y-4 self-end border-t border-foreground pt-4 max-[480px]:grid-cols-1 max-[480px]:gap-y-0">
            {RECORD.map((item) => (
              <div
                key={item.label}
                className="min-w-0 max-[480px]:flex max-[480px]:flex-row-reverse max-[480px]:items-baseline max-[480px]:justify-end max-[480px]:gap-3 max-[480px]:border-b max-[480px]:border-border max-[480px]:py-3"
              >
                <dt className="font-mono text-[10px] uppercase leading-[1.2] tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="m-0 mt-2 text-[clamp(24px,3vw,40px)] font-semibold leading-none tracking-[-0.04em] max-[480px]:mt-0 max-[480px]:w-[3.5ch] max-[480px]:text-[28px]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="work"
          aria-label="Work"
          className="scroll-mt-[68px] px-[clamp(16px,3vw,40px)] pb-[clamp(28px,4vw,48px)] pt-[clamp(36px,5vw,64px)]"
        >
          <div className="grid gap-[clamp(8px,1vw,16px)] sm:grid-cols-2 lg:grid-cols-3">
            {WORK.map((project, index) => {
              const featured = index === 0;
              const hoverMedia = project.media.find(
                (item) => item.kind === "image" && item.src !== project.image,
              );
              return (
                <article key={project.slug} className={featured ? "sm:col-span-2" : undefined}>
                  <Link
                    href={`/dashboard/projects/${project.slug}`}
                    className="group block text-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  >
                    <div
                        className={`relative overflow-hidden rounded-xl bg-foreground ${
                        featured ? "aspect-[2/1]" : "aspect-[4/3]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.image}
                        alt={project.imageAlt}
                        className={`h-full w-full object-cover transition-[transform,opacity] duration-500 ease-out group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
                          hoverMedia
                            ? "group-hover:opacity-0 group-focus-visible:opacity-0"
                            : ""
                        }`}
                      />
                      {hoverMedia ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={hoverMedia.src}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-0 transition-[transform,opacity] duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transition-none motion-reduce:scale-100"
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                      >
                        <span className="h-2.5 w-[18px] bg-white [clip-path:polygon(0_40%,65%_40%,65%_0,100%_50%,65%_100%,65%_60%,0_60%)]" />
                      </span>
                    </div>

                    <div className="flex min-w-0 items-baseline gap-2 pt-3">
                      <h3 className="m-0 min-w-0 flex-1 truncate text-[clamp(20px,2.4vw,34px)] font-semibold uppercase leading-none tracking-[-0.04em] transition-colors duration-200 group-hover:text-primary group-focus-visible:text-primary motion-reduce:transition-none">
                        {project.campaign ?? project.name}
                      </h3>
                      {project.campaign ? (
                        <>
                          <span aria-hidden="true" className="shrink-0 text-primary">
                            /
                          </span>
                          <p className="m-0 min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            {project.name}
                          </p>
                        </>
                      ) : null}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="contact"
          aria-labelledby="contact-title"
          className="scroll-mt-[68px] bg-primary px-[clamp(20px,5vw,72px)] py-[clamp(56px,8vw,112px)] text-white"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-[clamp(24px,5vw,80px)] gap-y-12 max-[820px]:grid-cols-1">
            <div>
              <h2
                id="contact-title"
                className="m-0 max-w-[10ch] text-[clamp(34px,5.4vw,76px)] font-semibold uppercase leading-[0.92] tracking-[-0.05em]"
              >
                Let us get to work
              </h2>
              <p className="mb-0 mt-8 max-w-[42ch] text-[16px] leading-[1.5] text-white">
                Send the business problem and the deadline. We come back with the shape of the
                answer and who would be on it.
              </p>
              <address className="mt-10 not-italic">
                <a
                  href="mailto:info@bbdowestafrica.com"
                  className="text-[clamp(18px,2vw,26px)] font-medium tracking-[-0.02em] text-white underline underline-offset-[6px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  info@bbdowestafrica.com
                </a>
                <p className="mb-0 mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white">
                  Lagos, Nigeria
                </p>
              </address>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
