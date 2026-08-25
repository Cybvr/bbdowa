import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-24 pt-[clamp(34px,5vw,68px)]">
      <section className="border-t-2 border-foreground py-[clamp(64px,10vw,140px)]">
        <h1 className="mb-6 mt-0 max-w-[11ch] text-[clamp(48px,7.5vw,96px)] uppercase leading-[0.86] tracking-[-0.04em]">
          Page not found
        </h1>
        <p className="mb-7 mt-0 max-w-[52ch] text-[20px] leading-[1.45] text-muted-foreground">
          This link is unavailable. Return to the home page and choose an existing section.
        </p>
        <Link
          href="/dashboard"
          className="font-extrabold text-foreground underline underline-offset-[5px] hover:text-primary focus-visible:text-primary"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
