import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, getProduct, productDate, productHref } from "@/lib/products";
import { longDate } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description };
}

const BRIEF_SECTION =
  "border-b border-ink pb-[clamp(28px,4vw,48px)] pl-0 pr-[clamp(24px,4vw,52px)] pt-[clamp(28px,4vw,48px)] [&:nth-child(even)]:border-l [&:nth-child(even)]:border-l-hairline [&:nth-child(even)]:pl-[clamp(24px,4vw,52px)] [&:nth-child(even)]:pr-0 max-[720px]:border-l-0 max-[720px]:px-0 max-[720px]:[&:nth-child(even)]:border-l-0 max-[720px]:[&:nth-child(even)]:px-0";
const BRIEF_HEADING =
  "mb-[18px] mt-0 text-[12px] uppercase tracking-[0.14em] text-brand";
const BRIEF_BODY = "m-0 max-w-[640px] text-[clamp(20px,2vw,28px)] leading-[1.28]";
const BRIEF_ITEM =
  "relative border-t border-hairline py-2.5 pl-[22px] text-[16px] leading-[1.35] before:absolute before:left-0 before:top-[17px] before:h-[7px] before:w-[7px] before:bg-brand before:content-['']";
const META_LABEL = "text-[11px] font-extrabold uppercase tracking-[0.14em] text-ash";
const META_ITEM =
  "flex min-h-[132px] flex-col justify-center gap-2 border-l border-hairline p-6 max-[720px]:border-l-0 max-[720px]:border-t max-[720px]:border-t-hairline max-[720px]:pl-0";

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const date = productDate(product);

  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink pb-5">
        <div className="flex flex-col items-start gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.avatar}
            alt={product.name}
            className="block h-[clamp(64px,9vw,110px)] w-[clamp(180px,28vw,380px)] object-contain object-left mix-blend-multiply"
          />
          <h1 className="m-0 text-[clamp(38px,6vw,86px)] uppercase leading-[0.9] tracking-[-0.06em]">
            {product.name}
          </h1>
        </div>
        <span className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-ash">
          {product.status}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 border-b border-ink py-[clamp(28px,4vw,48px)]">
        <p className="m-0 max-w-[850px] text-[clamp(19px,2vw,28px)] leading-[1.3]">
          {product.description}
        </p>
      </div>

      <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-[minmax(260px,1.2fr)_1fr_1fr] border-y border-ink max-[720px]:grid-cols-1">
        <div className="flex min-h-[132px] items-center gap-[18px] p-6 pl-0">
          <div
            aria-hidden="true"
            className="grid h-[72px] w-[72px] flex-none place-items-center rounded-full bg-brand text-[24px] font-black tracking-[-0.04em] text-white"
          >
            {product.owner ? product.owner.avatar : "—"}
          </div>
          <div>
            <span className={META_LABEL}>Role</span>
            <strong className="mt-[5px] block text-[clamp(18px,1.7vw,24px)] leading-[1.15]">
              <span>{product.owner ? product.owner.name : "Owner to be assigned"}</span>
              <br />
              <span>{product.owner ? product.owner.role : "Product Owner"}</span>
            </strong>
          </div>
        </div>
        <div className={META_ITEM}>
          <span className={META_LABEL}>{product.created ? "Date created" : "Target date"}</span>
          <strong className="text-[clamp(18px,1.7vw,24px)] leading-[1.15]">
            {date ? <time dateTime={date}>{longDate(date)}</time> : <time>Not scheduled</time>}
          </strong>
        </div>
        <div className={META_ITEM}>
          <span className={META_LABEL}>Project link</span>
          <Link
            href={productHref(product.slug)}
            className="text-[clamp(18px,1.7vw,24px)] font-bold leading-[1.15] text-ink underline underline-offset-[5px] hover:text-brand focus-visible:text-brand"
          >
            {product.slug}
          </Link>
        </div>
      </div>

      <section
        className="mt-[clamp(48px,7vw,88px)] grid grid-cols-2 border-t border-ink max-[720px]:grid-cols-1"
        aria-label="Product brief"
      >
        <article className={BRIEF_SECTION}>
          <h2 className={BRIEF_HEADING}>Objective</h2>
          <p className={BRIEF_BODY}>{product.objective}</p>
        </article>
        <article className={BRIEF_SECTION}>
          <h2 className={BRIEF_HEADING}>Users</h2>
          <div className="flex flex-wrap gap-2">
            {product.users.map((user) => (
              <span
                key={user}
                className="border border-ink px-[9px] py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em]"
              >
                {user}
              </span>
            ))}
          </div>
        </article>
        <article className={BRIEF_SECTION}>
          <h2 className={BRIEF_HEADING}>Goals</h2>
          <ul className="m-0 list-none p-0">
            {product.goals.map((goal) => (
              <li key={goal} className={BRIEF_ITEM}>
                {goal}
              </li>
            ))}
          </ul>
        </article>
        <article className={BRIEF_SECTION}>
          <h2 className={BRIEF_HEADING}>KPIs</h2>
          <ul className="m-0 list-none p-0">
            {product.kpis.map((kpi) => (
              <li key={kpi} className={BRIEF_ITEM}>
                {kpi}
              </li>
            ))}
          </ul>
        </article>
        <article className={BRIEF_SECTION}>
          <h2 className={BRIEF_HEADING}>Roadmap</h2>
          <ul className="m-0 list-none p-0">
            {product.roadmap.map((step) => (
              <li key={step} className={BRIEF_ITEM}>
                {step}
              </li>
            ))}
          </ul>
        </article>
        <article className={BRIEF_SECTION}>
          <h2 className={BRIEF_HEADING}>Review cadence</h2>
          <p className={BRIEF_BODY}>{product.reviewCadence}</p>
        </article>
      </section>
    </main>
  );
}
