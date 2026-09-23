import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team profile" };

export default function TeamProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
