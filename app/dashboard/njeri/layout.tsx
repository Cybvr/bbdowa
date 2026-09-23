import type { Metadata } from "next";

export const metadata: Metadata = { title: "Njeri" };

export default function NjeriLayout({ children }: { children: React.ReactNode }) {
  return children;
}
