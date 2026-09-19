import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PRODUCTS, getProduct, productDate, productHref } from "@/lib/products";
import { longDate } from "@/lib/format";
import { getUserByName, userHref } from "@/lib/users";
import { Badge, ImageWithFallback, MetaGrid, MetaItem, SectionHeading } from "@/components/dashboard/ui";

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

const BRIEF_ITEM =
  "relative border-t border-border py-2.5 pl-4 text-[14px] leading-[1.4] before:absolute before:left-0 before:top-[16px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:content-['']";

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const date = productDate(product);
  const ownerUser = product.owner ? getUserByName(product.owner.name) : undefined;

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <BackLink href="/dashboard/products" className="mb-5">
        All products
      </BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col items-start gap-4">
          <ImageWithFallback
            src={product.avatar}
            alt={product.name}
            className="block h-14 w-[160px] object-contain object-left mix-blend-multiply"
            fallbackClassName="h-14 w-[160px]"
          />
          <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">{product.name}</h1>
        </div>
        <Badge tone={product.status === "active" ? "active" : "neutral"}>{product.status}</Badge>
      </div>

      <div className="border-b border-border py-6">
        <p className="m-0 max-w-[850px] text-[17px] leading-[1.4]">{product.description}</p>
        <p className="m-0 mt-3 max-w-[850px] text-[14px] font-semibold leading-[1.4] text-primary">
          {product.valueLine}
        </p>
      </div>

      <div className="mt-6">
        <MetaGrid>
          <MetaItem label="Role">
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-full bg-primary text-[13px] font-bold text-white"
              >
                {ownerUser ? (
                  <ImageWithFallback
                    src={ownerUser.profileImage}
                    alt=""
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full"
                  />
                ) : product.owner ? (
                  product.owner.avatar
                ) : (
                  "—"
                )}
              </span>
              <span>
                {ownerUser ? (
                  <Link
                    href={userHref(ownerUser)}
                    className="text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
                  >
                    {product.owner!.name}
                  </Link>
                ) : (
                  <span className={product.owner ? "" : "text-muted-foreground"}>
                    {product.owner ? product.owner.name : "Owner to be assigned"}
                  </span>
                )}
                <br />
                <span className="text-[13px] font-normal text-muted-foreground">
                  {product.owner ? product.owner.role : "Product Owner"}
                </span>
              </span>
            </span>
          </MetaItem>
          <MetaItem label={product.created ? "Date created" : "Target date"}>
            {date ? <time dateTime={date}>{longDate(date)}</time> : <time>Not scheduled</time>}
          </MetaItem>
          <MetaItem label="Campaign link">
            <Link
              href={productHref(product.slug)}
              className="text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
            >
              {product.slug}
            </Link>
          </MetaItem>
        </MetaGrid>
      </div>

      <section className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 max-[720px]:grid-cols-1" aria-label="Product brief">
        <article>
          <SectionHeading>Objective</SectionHeading>
          <p className="m-0 max-w-[64ch] text-[15px] leading-[1.5]">{product.objective}</p>
        </article>
        <article>
          <SectionHeading>Users</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {product.users.map((user) => (
              <span key={user} className="rounded-md border border-border px-2 py-1 text-[12px] font-medium">
                {user}
              </span>
            ))}
          </div>
        </article>
        <article>
          <SectionHeading>Goals</SectionHeading>
          <ul className="m-0 list-none p-0">
            {product.goals.map((goal) => (
              <li key={goal} className={BRIEF_ITEM}>
                {goal}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <SectionHeading>KPIs</SectionHeading>
          <ul className="m-0 list-none p-0">
            {product.kpis.map((kpi) => (
              <li key={kpi} className={BRIEF_ITEM}>
                {kpi}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <SectionHeading>Roadmap</SectionHeading>
          <ul className="m-0 list-none p-0">
            {product.roadmap.map((step) => (
              <li key={step} className={BRIEF_ITEM}>
                {step}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <SectionHeading>Review cadence</SectionHeading>
          <p className="m-0 text-[15px] leading-[1.5]">{product.reviewCadence}</p>
        </article>
      </section>
    </main>
  );
}
