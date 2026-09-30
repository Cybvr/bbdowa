import { redirect } from "next/navigation";

export default function CareersPage() {
  redirect("/dashboard/help?tab=careers");
}
