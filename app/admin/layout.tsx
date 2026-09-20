import { DashboardChrome } from "@/components/dashboard-chrome";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardChrome>{children}</DashboardChrome>;
}
