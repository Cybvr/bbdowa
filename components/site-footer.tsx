import { Today } from "./today";

export function SiteFooter() {
  return (
    <footer className="flex flex-none justify-between gap-6 bg-foreground px-[clamp(24px,6vw,96px)] py-[34px] text-[14px] uppercase tracking-[0.08em] text-white max-[720px]:flex-col">
      <span>
        BBDO West Africa <Today />
      </span>
      <span>Do Big Things</span>
    </footer>
  );
}
