import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-primary px-[clamp(20px,5vw,72px)] pb-[clamp(48px,8vw,112px)] pt-[clamp(52px,8vw,112px)] text-white">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">About BBDO West Africa</p>
          <h1 className="mt-10 max-w-[10ch] text-[clamp(64px,13vw,190px)] uppercase leading-[0.82] tracking-[-0.06em]">
            Built to move people.
          </h1>
        </section>

        <section className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-x-[clamp(28px,8vw,128px)] gap-y-12 px-[clamp(20px,5vw,72px)] py-[clamp(56px,9vw,128px)] max-[820px]:grid-cols-1">
          <div>
            <p className={EYEBROW}>Our story</p>
            <p className="mb-0 mt-8 max-w-[16ch] text-[clamp(32px,4.4vw,64px)] uppercase leading-[0.94] tracking-[-0.05em]">
              West African thinking, connected to the world.
            </p>
          </div>

          <div className="max-w-[58ch] text-[18px] leading-[1.55]">
            <p className="mt-0">
              1891—a small agency named Batten Company opened in a single room in New York City. With time, it thrived.
            </p>
            <p>
              1928—it merged with Barton, Durstine and Osborn. And BBDO was born.
            </p>
            <p>
              Over 126 years later as the world’s most awarded agency network, BBDO is making waves across Africa with BBDO West Africa. Situated in Nigeria, BBDO West Africa serves as a major business hub for BBDO across the West African sub region.
            </p>
            <p>
              Our simple ambition of becoming the most preferred shapers of choice across the continent has seen us creating original, insightful and effective work for clients, spanning diverse industries.
            </p>
            <p>
              With over 15,000 people in 289 agencies across 81 countries, a large number of brands are now discovering the BBDO advantage.
            </p>
            <p className="mb-0">
              To learn more about the things we do differently which give us the marketing edge,{" "}
              <Link href="/the-plug" className="text-primary underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                plug in.
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
