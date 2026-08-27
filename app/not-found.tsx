import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center px-[clamp(24px,6vw,96px)] py-24">
      <section>
        <h1 className="m-0 text-[clamp(80px,16vw,220px)] uppercase leading-[0.82] tracking-[-0.07em] text-primary">
          404
        </h1>
        <p className="mb-8 mt-5 max-w-[30ch] text-[clamp(20px,2.4vw,32px)] uppercase leading-[1.05] tracking-[-0.02em]">
          This page could not be found.
        </p>
        <Link
          href="/"
          className="font-extrabold uppercase text-foreground underline underline-offset-[6px] hover:text-primary focus-visible:text-primary"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
