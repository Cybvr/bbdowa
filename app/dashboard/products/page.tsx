import type { Metadata } from "next";
import { ProductsTable } from "@/components/products-table";
import { PRODUCTS } from "@/lib/products";
import { PageHeader } from "@/components/dashboard/ui";

export const metadata: Metadata = {
  title: "Products",
  description: "Shared tools, platforms and agency-owned initiatives.",
};

export default function ProductsPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Products" description="Shared tools, platforms and agency-owned initiatives." />
      <ProductsTable products={PRODUCTS} />
    </main>
  );
}
