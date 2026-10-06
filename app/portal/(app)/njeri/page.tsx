import type { Metadata } from "next";
import { NjeriPageView } from "@/components/njeri/njeri-page-view";

export const metadata: Metadata = { title: "Njeri" };

export default function PortalNjeriPage() {
  return <NjeriPageView />;
}
