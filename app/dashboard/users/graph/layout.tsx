import type { Metadata } from "next";

export const metadata: Metadata = { title: "People graph" };

export default function PeopleGraphLayout({ children }: { children: React.ReactNode }) {
  return children;
}
