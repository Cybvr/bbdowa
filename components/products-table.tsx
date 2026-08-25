"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { productDate, productHref } from "@/lib/products";
import { longDate } from "@/lib/format";

const TH =
  "whitespace-nowrap border-b-2 border-foreground pb-3 pl-0 pr-4 pt-3 text-left text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground";
const TD =
  "border-b border-border pb-[22px] pl-0 pr-4 pt-[22px] align-middle text-[clamp(16px,1.4vw,20px)] leading-[1.25]";

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={TH}>Name</th>
            <th className={TH}>Status</th>
            <th className={TH}>Owner</th>
            <th className={TH}>Users</th>
            <th className={TH}>Created / target date</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const href = productHref(product.slug);
            const date = productDate(product);
            return (
              <tr
                key={product.slug}
                onClick={(event) => {
                  if (!(event.target as HTMLElement).closest("a")) router.push(href);
                }}
                className="cursor-pointer hover:bg-foreground/[0.04]"
              >
                <td className={TD}>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2.5 text-[clamp(22px,2.4vw,34px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-foreground no-underline after:whitespace-nowrap after:text-primary after:content-['_→'] hover:text-primary focus-visible:text-primary"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.avatar}
                      alt={product.name}
                      className="block h-[54px] w-[clamp(120px,13vw,180px)] object-contain object-left mix-blend-multiply"
                    />
                  </Link>
                </td>
                <td className={TD}>
                  <span
                    className={`inline-block px-[9px] py-[5px] text-[10px] font-extrabold uppercase tracking-[0.12em] text-white ${
                      product.status === "active" ? "bg-primary" : "bg-foreground"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className={TD}>
                  {product.owner ? (
                    <span className="flex items-center gap-3 whitespace-nowrap">
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary text-[14px] font-black tracking-[-0.03em] text-white"
                      >
                        {product.owner.avatar}
                      </span>
                      {product.owner.name}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={TD}>
                  <span className="flex flex-wrap gap-1.5">
                    {product.users.map((user) => (
                      <span
                        key={user}
                        className="whitespace-nowrap border border-foreground px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]"
                      >
                        {user}
                      </span>
                    ))}
                  </span>
                </td>
                <td className={`${TD} whitespace-nowrap [font-variant-numeric:tabular-nums]`}>
                  {date ? <time dateTime={date}>{longDate(date)}</time> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
