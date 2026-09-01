import type { Metadata } from "next";

export const metadata: Metadata = { title: "Brand" };

const COLORS: { name: string; value: string; token: string }[] = [
  { name: "Red", value: "#e51b23", token: "--red" },
  { name: "Black", value: "#111111", token: "--black" },
  { name: "White", value: "#ffffff", token: "--white" },
];

const TYPE: { name: string; usage: string; className: string }[] = [
  { name: "Outfit", usage: "Headlines and body", className: "font-sans" },
  { name: "Roboto Mono", usage: "Labels, code, data", className: "font-mono" },
];

const SCALE: { label: string; size: string; className: string }[] = [
  { label: "Display", size: "clamp(32px, 4vw, 58px)", className: "text-[clamp(32px,4vw,58px)] uppercase leading-[0.95] tracking-[-0.045em]" },
  { label: "Heading", size: "clamp(19px, 2vw, 26px)", className: "text-[clamp(19px,2vw,26px)] leading-[1.2] tracking-[-0.02em]" },
  { label: "Body", size: "16px", className: "text-[16px] leading-[1.5]" },
  { label: "Label", size: "13px", className: "text-[13px] font-extrabold uppercase tracking-[0.16em]" },
];

const RULES: string[] = [
  "Write the name as BBDO West Africa. Never BBDO Westafrica or BBDO WA.",
  "Red is for emphasis only: one accent per view, never as a page background.",
  "Keep clear space around the logo equal to the height of the O.",
  "Do not recolour, stretch, outline, or add effects to the logo.",
  "Set headlines in uppercase Outfit with tight tracking. Body copy stays sentence case.",
];

const META = "text-[13px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground";
const SECTION_TITLE = "mb-1 mt-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-primary";

export default function BrandPage() {
  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-foreground pb-5">
        <h1 className="m-0 text-[clamp(32px,4vw,58px)] uppercase leading-[0.95] tracking-[-0.045em]">
          Brand
        </h1>
        <span className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          Colour, type, logo
        </span>
      </div>

      <div className="mt-[clamp(34px,4.5vw,56px)]">
        <h2 className={SECTION_TITLE}>Logo</h2>
        <div className="border-t border-foreground pt-5">
          <div className="flex items-center justify-center border border-border bg-white p-[clamp(24px,5vw,64px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bbdo-west-africa.png"
              alt="BBDO West Africa logo"
              className="h-auto w-full max-w-[420px]"
            />
          </div>
          <a
            href="/bbdo-west-africa.png"
            download
            className="mt-3 inline-block text-[13px] font-extrabold uppercase tracking-[0.1em] text-foreground no-underline hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            Primary PNG ↓
          </a>
        </div>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <div>
            <div className="flex items-center justify-center border border-border bg-white p-[clamp(24px,5vw,64px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bbdo-west-africa.png"
                alt="BBDO West Africa logo, black"
                className="h-auto w-full max-w-[360px] [filter:brightness(0)]"
              />
            </div>
            <a
              href="/bbdo-west-africa.png"
              download
              className="mt-3 inline-block text-[13px] font-extrabold uppercase tracking-[0.1em] text-foreground no-underline hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Black on white ↓
            </a>
          </div>
          <div>
            <div className="flex items-center justify-center border border-border bg-black p-[clamp(24px,5vw,64px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bbdo-west-africa.png"
                alt="BBDO West Africa logo, white"
                className="h-auto w-full max-w-[360px] [filter:brightness(0)_invert(1)]"
              />
            </div>
            <a
              href="/bbdo-west-africa.png"
              download
              className="mt-3 inline-block text-[13px] font-extrabold uppercase tracking-[0.1em] text-foreground no-underline hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              White on black ↓
            </a>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(34px,4.5vw,56px)]">
        <h2 className={SECTION_TITLE}>Colour</h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 border-t border-foreground p-0 pt-5">
          {COLORS.map((color) => (
            <li key={color.token}>
              <div
                className="h-[120px] border border-border"
                style={{ background: color.value }}
              />
              <p className="mb-0 mt-3 text-[clamp(19px,2vw,26px)] leading-[1.2] tracking-[-0.02em]">
                {color.name}
              </p>
              <p className={`m-0 ${META}`}>
                {color.value} · var({color.token})
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-[clamp(34px,4.5vw,56px)]">
        <h2 className={SECTION_TITLE}>Typefaces</h2>
        <ul className="m-0 list-none border-t border-foreground p-0">
          {TYPE.map((face) => (
            <li key={face.name} className="border-b border-border py-[15px]">
              <p
                className={`m-0 text-[clamp(19px,2vw,26px)] leading-[1.2] tracking-[-0.02em] ${face.className}`}
              >
                {face.name}
              </p>
              <p className={`m-0 ${META}`}>{face.usage}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-[clamp(34px,4.5vw,56px)]">
        <h2 className={SECTION_TITLE}>Type scale</h2>
        <ul className="m-0 list-none border-t border-foreground p-0">
          {SCALE.map((step) => (
            <li
              key={step.label}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-[15px]"
            >
              <span className={step.className}>{step.label}</span>
              <span className={META}>{step.size}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-[clamp(34px,4.5vw,56px)]">
        <h2 className={SECTION_TITLE}>Usage</h2>
        <ul className="m-0 list-none border-t border-foreground p-0">
          {RULES.map((rule) => (
            <li
              key={rule}
              className="border-b border-border py-[15px] text-[clamp(16px,1.5vw,20px)] leading-[1.4]"
            >
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
