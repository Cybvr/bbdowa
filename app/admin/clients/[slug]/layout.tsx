import type { Metadata } from "next";
import ClientWorkspacePage from "@/components/client-workspace-page";

export const metadata: Metadata = { title: "Client workspace" };

// The workspace lives in the layout so switching tabs keeps it mounted
// instead of reloading the client's data on every route change.
export default function ClientWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClientWorkspacePage />
      {children}
    </>
  );
}
