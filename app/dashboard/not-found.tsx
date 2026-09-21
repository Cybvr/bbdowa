import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <section className="border-t border-border py-16 sm:py-24">
        <h1 className="mb-4 mt-0 max-w-[16ch] text-[32px] font-bold leading-tight tracking-tight sm:text-[44px]">
          Page not found
        </h1>
        <p className="mb-5 mt-0 max-w-[52ch] text-[16px] leading-[1.5] text-muted-foreground">
          This link is unavailable. Return to the home page and choose an existing section.
        </p>
        <Link
          href="/dashboard"
          className="text-[14px] font-semibold text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
