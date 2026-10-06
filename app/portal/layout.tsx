import type { Metadata } from "next";
import { PortalShell } from "@/components/portal-shell";

export const metadata: Metadata = { title: "Client portal" };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
