import { redirect } from "next/navigation";

export default function BrandPage() {
  redirect("/dashboard/help?tab=resources&view=brand");
}
