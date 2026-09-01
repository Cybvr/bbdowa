import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PRODUCTS, productHref } from "@/lib/products";
import { PROJECTS, projectHref } from "@/lib/projects";
import { TEAM, userInitials } from "@/lib/users";

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

const META_LABEL = "text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground";
const META_VALUE = "mt-2 block text-[clamp(20px,2vw,28px)] leading-[1.2]";
const SECTION_TITLE = "mb-3 mt-0 text-[13px] font-extrabold uppercase tracking-[0.14em] text-primary";
const WORK_LINK =
  "group flex items-baseline justify-between gap-5 border-b border-border py-4 text-foreground no-underline hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export default async function UserDetailPage({ params }: Params) {
  const { slug } = await params;
  const user = TEAM.find((member) => member.slug === slug);
  if (!user) notFound();

  const projects = PROJECTS.filter((project) => project.lead === user.name);
  const products = PRODUCTS.filter((product) => product.owner?.name === user.name);

  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-24 pt-[clamp(30px,4vw,56px)]">
      <BackLink href="/dashboard/people" className="mb-[26px]">
        Back to directory
      </BackLink>

      <section className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-[clamp(24px,4vw,52px)] border-b-2 border-foreground pb-[clamp(30px,5vw,60px)] max-[640px]:grid-cols-1">
        <div
          aria-hidden="true"
          className="grid h-[clamp(104px,16vw,190px)] w-[clamp(104px,16vw,190px)] place-items-center overflow-hidden rounded-full bg-primary text-[clamp(32px,5vw,64px)] font-black tracking-[-0.04em] text-white"
        >
          {user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            userInitials(user)
          )}
        </div>
        <div>
          <p className="mb-3 mt-0 text-[13px] font-extrabold uppercase tracking-[0.14em] text-primary">
            {user.department}
          </p>
          <h1 className="m-0 max-w-[15ch] text-[clamp(38px,6vw,76px)] uppercase leading-[0.9] tracking-[-0.04em]">
            {user.name}
          </h1>
          <p className="mb-0 mt-5 text-[clamp(19px,2.2vw,30px)] leading-[1.2] text-muted-foreground">
            {user.title}
          </p>
        </div>
      </section>

      <section
        className="grid grid-cols-2 border-b border-foreground max-[640px]:grid-cols-1"
        aria-label="User information"
      >
        <div className="min-h-[132px] py-7 pr-8 max-[640px]:min-h-0 max-[640px]:pr-0">
          <span className={META_LABEL}>Role</span>
          <strong className={META_VALUE}>{user.title}</strong>
        </div>
        <div className="min-h-[132px] border-l border-border px-8 py-7 max-[640px]:min-h-0 max-[640px]:border-l-0 max-[640px]:border-t max-[640px]:px-0">
          <span className={META_LABEL}>Department</span>
          <strong className={META_VALUE}>{user.department}</strong>
        </div>
      </section>

      <section className="mt-[clamp(56px,8vw,100px)] grid grid-cols-2 gap-x-[clamp(36px,7vw,100px)] gap-y-14 max-[760px]:grid-cols-1" aria-label="Linked work">
        <div>
          <h2 className={SECTION_TITLE}>Projects led</h2>
          {projects.length ? (
            <ul className="m-0 list-none border-t border-foreground p-0">
              {projects.map((project) => (
                <li key={project.slug}>
                  <Link href={projectHref(project.slug)} className={WORK_LINK}>
                    <span className="text-[clamp(18px,2vw,26px)] font-bold leading-[1.15]">
                      {project.name}
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground group-hover:text-primary">
                      {project.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border-y border-border py-5 text-[17px] text-muted-foreground">
              No linked projects yet.
            </p>
          )}
        </div>

        <div>
          <h2 className={SECTION_TITLE}>Products owned</h2>
          {products.length ? (
            <ul className="m-0 list-none border-t border-foreground p-0">
              {products.map((product) => (
                <li key={product.slug}>
                  <Link href={productHref(product.slug)} className={WORK_LINK}>
                    <span className="text-[clamp(18px,2vw,26px)] font-bold leading-[1.15]">
                      {product.name}
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground group-hover:text-primary">
                      {product.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border-y border-border py-5 text-[17px] text-muted-foreground">
              No linked products yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
