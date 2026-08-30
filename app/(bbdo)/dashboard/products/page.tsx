import type { Metadata } from "next";
import { ProductsTable } from "@/components/products-table";
import { PRODUCTS } from "@/lib/products";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "Products",
  description: "Shared tools, platforms and agency-owned initiatives.",
};

export default function ProductsPage() {
  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-[100px] pt-[clamp(48px,7vw,96px)]">
      <div className="mb-[clamp(40px,6vw,72px)] flex items-end justify-between gap-8 max-[720px]:flex-col max-[720px]:items-start">
        <h1 className="m-0 text-[clamp(40px,5vw,68px)] uppercase leading-[0.9] tracking-[-0.05em]">
          Products
        </h1>
        <p className="mb-2 mt-0 max-w-[28ch] text-[clamp(18px,2vw,26px)] leading-[1.2]">
          Shared tools, platforms and agency-owned initiatives.
        </p>
      </div>

      <p className="mb-4 mt-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-primary">
        {plural(PRODUCTS.length, "product")}
      </p>

      <ProductsTable products={PRODUCTS} />
    </main>
  );
}
