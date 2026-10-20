import { EmailFolderPage } from "./folder-page";
import type { EmailTab } from "@/components/dashboard/email/types";

const FOLDERS: EmailTab[] = ["inbox", "updates", "drafts", "messages", "bin", "templates", "lists"];

type Props = { searchParams: Promise<{ folder?: string | string[] }> };

export default async function EmailPage({ searchParams }: Props) {
  const requested = (await searchParams).folder;
  const folder = Array.isArray(requested) ? requested[0] : requested;
  const initialTab = folder === "sent" ? "messages" : FOLDERS.includes(folder as EmailTab) ? folder as EmailTab : "inbox";
  return <EmailFolderPage folder={initialTab} />;
}
