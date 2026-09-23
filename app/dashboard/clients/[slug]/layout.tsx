import type { Metadata } from "next";

export const metadata: Metadata = { title: "Client workspace" };

export default function ClientWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
