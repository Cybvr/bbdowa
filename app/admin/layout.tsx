import { DashboardChrome } from "@/components/dashboard-chrome";
import { AdminGate } from "@/components/admin-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardChrome>
      <AdminGate>{children}</AdminGate>
    </DashboardChrome>
  );
}
