import type { Metadata } from "next";

export const metadata: Metadata = { title: "Brand" };

const SECTIONS: { id: string; label: string }[] = [
  { id: "cover", label: "Cover" },
  { id: "about", label: "About" },
  { id: "tone-of-voice", label: "Tone of voice" },
  { id: "logo", label: "Logo" },
  { id: "colour", label: "Colour" },
  { id: "type", label: "Type" },
  { id: "photography", label: "Photography" },
  { id: "patterns", label: "Patterns" },
];

const ABOUT: string[] = [
  "BBDO West Africa is the Lagos studio of the BBDO network and the hub for the West African sub-region. We make culturally relevant, insightful and effective campaigns that drive brand value and grow our clients' businesses.",
  "We hold to the network tradition of The Work, The Work, The Work: creativity that proves itself in market. This guide covers how the brand looks, sounds and behaves, so anyone in the building can use it without asking.",
];

const VOICE: string[] = [
  "Our voice comes from the bantaba, the gathering place where a community meets to talk, tell stories and decide things together. We write the way people talk there. Everyone under the tree can follow the talk, so we use plain words and short sentences. If someone outside the industry would need a sentence explained, we rewrite it.",
  "News travels through the bantaba as stories about people, so we start with what happened and who it happened to, and bring the numbers in after, as support. A gathering only works if people answer back: we ask questions we actually want answered, credit people by name, and write as we.",
  "The bantaba exists so the community can decide together. Every piece of writing ends with a position or a next step the reader can act on.",
];

const LOGO_RATIONALE: string[] = [
  "The mark is the region's initials drawn heavy enough to work as a stamp, and it holds up at any size, from a favicon to a hoarding. The W is two round arches. The A drops the curves for a straight-sided triangle, wide at the base and rooted, like the tree a bantaba gathers under. A single diagonal cut separates the two letters where they share one block; they stay joined because the studio and the region are.",
  "It sits in black on white or white on black. Red is kept for accents, so the mark never competes with the work around it.",
];

const PHOTOGRAPHY: string[] = [
  "Shoot people the way you would meet them at the bantaba: real, present and mid-conversation. We pick candid frames over staged ones, natural light over studio gloss, and streets, markets and compounds over seamless backdrops.",
  "Faces carry the work. Get close, stay at eye level and let the subject look back at the camera. Crowds, hands and food are all fair game; empty stock scenery is not.",
  "Colour in photographs stays true to life. No heavy filters, no desaturated moods, and no red casts that fight the brand red.",
];

const PATTERNS: string[] = [
  "Our patterns come from the letterforms. The round arch of the W, the triangle of the A and the diagonal cut between them repeat as tiles in black, white and red.",
  "Use one pattern per surface, in one colour on one background. Type never sits directly on a pattern; give it a solid panel first.",
];

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

const LOGO_RULES: string[] = [
  "Write the name as BBDO West Africa. Never BBDO Westafrica or BBDO WA.",
  "Keep clear space around the logo equal to the height of the O.",
  "Do not recolour, stretch, outline, or add effects to the logo.",
];

const META = "text-[13px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground";
const SECTION_TITLE = "mb-1 mt-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-primary";
const SUB_TITLE = "mb-3 mt-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground";
const PROSE = "mb-4 mt-0 max-w-[68ch] text-[clamp(16px,1.5vw,20px)] leading-[1.5]";

function sectionTitle(id: string) {
  const index = SECTIONS.findIndex((section) => section.id === id);
  return `${index + 1}. ${SECTIONS[index].label}`;
}

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

      <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-x-[clamp(28px,4vw,64px)] max-[820px]:grid-cols-1">
        <nav aria-label="Contents" className="max-[820px]:mt-[clamp(20px,2.5vw,32px)]">
          <ol className="sticky top-24 m-0 mt-[clamp(34px,4.5vw,56px)] flex list-none flex-col gap-y-2 p-0 max-[820px]:static max-[820px]:mt-0">
            {SECTIONS.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-[15px] leading-[1.4] text-foreground no-underline hover:text-primary focus-visible:text-primary"
                >
                  {index + 1}. {section.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div>
      <div id="cover" className="mt-[clamp(34px,4.5vw,56px)] scroll-mt-24">
        <h2 className={SECTION_TITLE}>{sectionTitle("cover")}</h2>
        <div className="border-t border-foreground pt-5">
          <div className="flex min-h-[clamp(360px,50vw,560px)] flex-col justify-between bg-black p-[clamp(24px,4vw,56px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bbdo-west-africa.png"
              alt="BBDO West Africa logo"
              className="h-auto w-full max-w-[260px] [filter:brightness(0)_invert(1)]"
            />
            <div>
              <p className="m-0 text-[clamp(36px,5vw,72px)] uppercase leading-[0.95] tracking-[-0.045em] text-white">
                Brand
                <br />
                <span className="text-primary">guidelines</span>
              </p>
              <p className="mb-0 mt-5 text-[13px] font-extrabold uppercase tracking-[0.14em] text-white/60">
                BBDO West Africa · Lagos · 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      <div id="about" className="mt-[clamp(34px,4.5vw,56px)] scroll-mt-24">
        <h2 className={SECTION_TITLE}>{sectionTitle("about")}</h2>
        <div className="border-t border-foreground pt-5">
          {ABOUT.map((paragraph) => (
            <p key={paragraph} className={PROSE}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div id="tone-of-voice" className="mt-[clamp(34px,4.5vw,56px)] scroll-mt-24">
        <h2 className={SECTION_TITLE}>{sectionTitle("tone-of-voice")}</h2>
        <div className="border-t border-foreground pt-5">
          {VOICE.map((paragraph) => (
            <p key={paragraph} className={PROSE}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div id="logo" className="mt-[clamp(34px,4.5vw,56px)] scroll-mt-24">
        <h2 className={SECTION_TITLE}>{sectionTitle("logo")}</h2>
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
        <div className="mt-8">
          <h3 className={SUB_TITLE}>Rationale</h3>
          {LOGO_RATIONALE.map((paragraph) => (
            <p key={paragraph} className={PROSE}>
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-8">
          <h3 className={SUB_TITLE}>Usage</h3>
          <ul className="m-0 list-none p-0">
            {LOGO_RULES.map((rule) => (
              <li
                key={rule}
                className="border-b border-border py-[15px] text-[clamp(16px,1.5vw,20px)] leading-[1.4]"
              >
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div id="colour" className="mt-[clamp(34px,4.5vw,56px)] scroll-mt-24">
        <h2 className={SECTION_TITLE}>{sectionTitle("colour")}</h2>
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
        <p className={`${PROSE} mt-5`}>
          Red is for emphasis only: one accent per view, never as a page background.
        </p>
      </div>

      <div id="type" className="mt-[clamp(34px,4.5vw,56px)] scroll-mt-24">
        <h2 className={SECTION_TITLE}>{sectionTitle("type")}</h2>
        <div className="border-t border-foreground pt-5">
          <h3 className={SUB_TITLE}>Typefaces</h3>
          <ul className="m-0 list-none p-0">
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
          <h3 className={`${SUB_TITLE} mt-8`}>Scale</h3>
          <ul className="m-0 list-none p-0">
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
          <p className={`${PROSE} mt-5`}>
            Set headlines in uppercase Outfit with tight tracking. Body copy stays sentence case.
          </p>
        </div>
      </div>

      <div id="photography" className="mt-[clamp(34px,4.5vw,56px)] scroll-mt-24">
        <h2 className={SECTION_TITLE}>{sectionTitle("photography")}</h2>
        <div className="border-t border-foreground pt-5">
          {PHOTOGRAPHY.map((paragraph) => (
            <p key={paragraph} className={PROSE}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div id="patterns" className="mt-[clamp(34px,4.5vw,56px)] scroll-mt-24">
        <h2 className={SECTION_TITLE}>{sectionTitle("patterns")}</h2>
        <div className="border-t border-foreground pt-5">
          {PATTERNS.map((paragraph) => (
            <p key={paragraph} className={PROSE}>
              {paragraph}
            </p>
          ))}
          <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <div>
              <svg
                className="h-[160px] w-full border border-border"
                role="img"
                aria-label="Arch pattern"
              >
                <defs>
                  <pattern id="pattern-arch" width="48" height="48" patternUnits="userSpaceOnUse">
                    <rect width="48" height="48" fill="#ffffff" />
                    <path d="M0 48 a24 24 0 0 1 48 0 Z" fill="#111111" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pattern-arch)" />
              </svg>
              <p className={`mb-0 mt-3 ${META}`}>Arch · from the W</p>
            </div>
            <div>
              <svg
                className="h-[160px] w-full border border-border"
                role="img"
                aria-label="Triangle pattern"
              >
                <defs>
                  <pattern
                    id="pattern-triangle"
                    width="48"
                    height="48"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="48" height="48" fill="#ffffff" />
                    <path d="M24 8 L44 44 L4 44 Z" fill="#e51b23" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pattern-triangle)" />
              </svg>
              <p className={`mb-0 mt-3 ${META}`}>Triangle · from the A</p>
            </div>
            <div>
              <div
                className="h-[160px] w-full border border-border"
                role="img"
                aria-label="Cut pattern"
                style={{
                  background: "repeating-linear-gradient(63deg, #111111 0 6px, #ffffff 6px 30px)",
                }}
              />
              <p className={`mb-0 mt-3 ${META}`}>Cut · from the diagonal</p>
            </div>
          </div>
        </div>
      </div>

        </div>
      </div>
    </main>
  );
}
