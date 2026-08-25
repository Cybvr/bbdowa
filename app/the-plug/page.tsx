import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const LINK = "text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export default function ThePlugPage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-primary px-[clamp(20px,5vw,72px)] pb-[clamp(48px,8vw,112px)] pt-[clamp(52px,8vw,112px)] text-white">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">The Plug</p>
          <h1 className="mt-10 max-w-[8ch] text-[clamp(64px,15vw,208px)] uppercase leading-[0.82] tracking-[-0.06em]">
            Plug in.
          </h1>
        </section>

        <section className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-x-[clamp(28px,8vw,128px)] gap-y-12 px-[clamp(20px,5vw,72px)] py-[clamp(56px,9vw,128px)] max-[820px]:grid-cols-1">
          <p className="m-0 max-w-[12ch] text-[clamp(36px,5vw,76px)] uppercase leading-[0.9] tracking-[-0.05em]">Plug into the work.</p>
          <div className="max-w-[58ch] text-[18px] leading-[1.55]">
            <p className="mt-0">
              To learn more about the things we do differently which give us the marketing edge, plug in.
            </p>
            <p>
              Explore the people, resources and opportunities behind the work.
            </p>
            <ul className="m-0 mt-10 list-none border-t border-foreground p-0">
              <li className="border-b border-foreground py-5"><Link href="/dashboard/resources" className={LINK}>Resources ↗</Link></li>
              <li className="border-b border-foreground py-5"><Link href="/dashboard/people" className={LINK}>People ↗</Link></li>
              <li className="border-b border-foreground py-5"><Link href="/dashboard/careers" className={LINK}>Careers ↗</Link></li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
