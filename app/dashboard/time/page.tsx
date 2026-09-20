import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Tracker" };

export default function TimePage() {
  redirect("/dashboard/tracker");
}
