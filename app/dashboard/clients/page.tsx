import { redirect } from "next/navigation";

export default function DashboardClientsRedirect() {
  redirect("/admin/clients");
}
