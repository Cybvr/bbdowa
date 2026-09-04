import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PRODUCTS, productHref } from "@/lib/products";
import { CAMPAIGNS, campaignHref } from "@/lib/campaigns";
import { TEAM, userInitials } from "@/lib/users";
import { ImageWithFallback, MetaGrid, MetaItem, SectionHeading } from "@/components/dashboard/ui";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TEAM.map((user) => ({ slug: user.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const user = TEAM.find((member) => member.slug === slug);
  if (!user) return { title: "User not found" };

  return {
    title: user.name,
    description: `${user.title}, ${user.department} at BBDO West Africa.`,
  };
}

const WORK_LINK =
  "group flex items-baseline justify-between gap-5 border-b border-border py-3.5 text-foreground no-underline hover:text-primary focus-visible:text-primary focus-visible:outline-none";

export default async function UserDetailPage({ params }: Params) {
  const { slug } = await params;
  const user = TEAM.find((member) => member.slug === slug);
  if (!user) notFound();

  const campaigns = CAMPAIGNS.filter((campaign) => campaign.lead === user.name);
  const products = PRODUCTS.filter((product) => product.owner?.name === user.name);

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <BackLink href="/dashboard/people" className="mb-5">
        Back to directory
      </BackLink>

      <section className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6 border-b border-border pb-8 max-[560px]:grid-cols-1">
        <div
          aria-hidden="true"
          className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-primary text-[24px] font-bold text-white sm:h-24 sm:w-24"
        >
          <ImageWithFallback
            src={user.profileImage}
            alt=""
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
          />
        </div>
        <div>
          <p className="mb-1.5 mt-0 text-[13px] font-semibold text-primary">{user.department}</p>
          <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">{user.name}</h1>
          <p className="mb-0 mt-2 text-[15px] leading-[1.35] text-muted-foreground">{user.title}</p>
        </div>
      </section>

      <section className="mt-6" aria-label="User information">
        <MetaGrid columns={2}>
          <MetaItem label="Role">{user.title}</MetaItem>
          <MetaItem label="Department">{user.department}</MetaItem>
        </MetaGrid>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2" aria-label="Linked work">
        <div>
          <SectionHeading>Campaigns led</SectionHeading>
          {campaigns.length ? (
            <ul className="m-0 list-none border-t border-border p-0">
              {campaigns.map((campaign) => (
                <li key={campaign.slug}>
                  <Link href={campaignHref(campaign.slug)} className={WORK_LINK}>
                    <span className="text-[16px] font-semibold leading-[1.15]">{campaign.name}</span>
                    <span className="text-[12px] font-medium text-muted-foreground group-hover:text-primary">
                      {campaign.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border-t border-border py-4 text-[14px] text-muted-foreground">
              No linked campaigns yet.
            </p>
          )}
        </div>

        <div>
          <SectionHeading>Products owned</SectionHeading>
          {products.length ? (
            <ul className="m-0 list-none border-t border-border p-0">
              {products.map((product) => (
                <li key={product.slug}>
                  <Link href={productHref(product.slug)} className={WORK_LINK}>
                    <span className="text-[16px] font-semibold leading-[1.15]">{product.name}</span>
                    <span className="text-[12px] font-medium text-muted-foreground group-hover:text-primary">
                      {product.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border-t border-border py-4 text-[14px] text-muted-foreground">
              No linked products yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
