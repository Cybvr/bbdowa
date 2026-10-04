"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { ImageUploadField } from "@/components/detail-editor";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";

export type CreateType = "update" | "resource" | "client" | "job";
type JobStatus = "active" | "completed" | "archived";
type ClientOption = { slug: string; name: string };

const CREATE_COPY: Record<CreateType, { button: string; title: string; description: string }> = {
  update: {
    button: "New",
    title: "New",
    description: "Publish a new agency update.",
  },
  resource: {
    button: "New",
    title: "New",
    description: "Add a resource to the agency library.",
  },
  client: {
    button: "New client",
    title: "New client",
    description: "Create a client record. You can add more detail from the client workspace.",
  },
  job: {
    button: "New",
    title: "New",
    description: "Create a job for a client, then add its details, pay and assignment.",
  },
};

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "item"}-${Date.now().toString(36)}`;
}

const UPDATE_CATEGORIES = ["News", "People", "Work", "Industry"] as const;
const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const LABEL = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const TEXTAREA =
  "flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function QuickCreate({ type, iconOnly = false }: { type: CreateType; iconOnly?: boolean }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [loadingClients, setLoadingClients] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [clients, setClients] = React.useState<ClientOption[]>([]);

  // Update fields.
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<(typeof UPDATE_CATEGORIES)[number]>("News");
  const [excerpt, setExcerpt] = React.useState("");
  const [sourceName, setSourceName] = React.useState("BBDO West Africa");

  // Resource fields.
  const [label, setLabel] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [meta, setMeta] = React.useState("");
  const [href, setHref] = React.useState("");

  // Client fields.
  const [clientName, setClientName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [clientDate, setClientDate] = React.useState("");
  const [profileImage, setProfileImage] = React.useState("");
  const [clientDescription, setClientDescription] = React.useState("");

  // Job fields.
  const [jobTitle, setJobTitle] = React.useState("");
  const [jobClientId, setJobClientId] = React.useState("");
  const [jobCategory, setJobCategory] = React.useState("");
  const [jobStatus, setJobStatus] = React.useState<JobStatus>("active");
  const [jobYear, setJobYear] = React.useState("");
  const [jobLiveDate, setJobLiveDate] = React.useState("");

  const copy = CREATE_COPY[type];

  React.useEffect(() => {
    if (!open || type !== "job") return;

    let active = true;
    setLoadingClients(true);
    getDocs(collection(firebaseDb, "clients"))
      .then((snapshot) => {
        if (!active) return;
        const options = snapshot.docs
          .map((document) => {
            const data = document.data() as { name?: string; slug?: string };
            return { slug: data.slug ?? document.id, name: data.name ?? document.id };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        setClients(options);
        setJobClientId((current) => current || options[0]?.slug || "");
      })
      .catch((cause) => {
        console.error("Unable to load clients for job creation", cause);
        if (active) setError("Unable to load clients. Try again.");
      })
      .finally(() => {
        if (active) setLoadingClients(false);
      });

    return () => {
      active = false;
    };
  }, [open, type]);

  if (!isAdmin) return null;

  const reset = () => {
    setTitle("");
    setCategory("News");
    setExcerpt("");
    setSourceName("BBDO West Africa");
    setLabel("");
    setGroup("");
    setMeta("");
    setHref("");
    setClientName("");
    setIndustry("");
    setClientDate("");
    setProfileImage("");
    setClientDescription("");
    setJobTitle("");
    setJobClientId("");
    setJobCategory("");
    setJobStatus("active");
    setJobYear("");
    setJobLiveDate("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const canSave =
    type === "update"
      ? title.trim().length > 0
      : type === "resource"
        ? label.trim().length > 0
        : type === "client"
          ? clientName.trim().length > 0 && industry.trim().length > 0
          : jobTitle.trim().length > 0 && Boolean(jobClientId) && !loadingClients;

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || busy) return;
    setBusy(true);
    setError(null);

    try {
      if (type === "update") {
        const slug = slugify(title);
        await setDoc(doc(firebaseDb, "blogs", slug), {
          slug,
          title: title.trim(),
          excerpt: excerpt.trim(),
          category,
          publishedAt: new Date().toISOString().slice(0, 10),
          sourceName: sourceName.trim() || "BBDO West Africa",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setOpen(false);
        reset();
        router.push(`/blog/${slug}`);
      } else if (type === "resource") {
        const slug = slugify(label);
        await setDoc(doc(firebaseDb, "resources", slug), {
          type: "resource",
          slug,
          label: label.trim(),
          group: group.trim() || "Internal",
          meta: meta.trim(),
          image: null,
          ...(href.trim() ? { href: href.trim() } : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setOpen(false);
        reset();
        router.push("/dashboard/resources");
      } else if (type === "client") {
        const slug = slugify(clientName);
        await setDoc(doc(firebaseDb, "clients", slug), {
          type: "client",
          slug,
          name: clientName.trim(),
          date: clientDate || null,
          industry: industry.trim(),
          profileImage: profileImage.trim() || null,
          description: clientDescription.trim() || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setOpen(false);
        reset();
        router.push(`/dashboard/clients/${slug}/overview`);
      } else {
        const selectedClient = clients.find((client) => client.slug === jobClientId);
        if (!selectedClient) throw new Error("Choose a client before creating the job.");

        const slug = slugify(jobTitle);
        const parsedYear = jobYear.trim() ? Number(jobYear) : null;
        const jobName = jobTitle.trim();
        await setDoc(doc(firebaseDb, await jobsCollection(), slug), {
          slug,
          name: jobName,
          title: jobName,
          clientId: selectedClient.slug,
          clientName: selectedClient.name,
          category: jobCategory.trim() || "General",
          year: Number.isFinite(parsedYear as number) ? parsedYear : null,
          liveAt: jobLiveDate ? { date: jobLiveDate } : null,
          status: jobStatus,
          leadUserId: null,
          publishedBy: null,
          fee: "To be confirmed",
          target: "To be confirmed",
          result: "To be confirmed",
          image: "/images/projects/project-placeholder.svg",
          imageAlt: `${jobName} job placeholder`,
          media: [],
          summary: "Job details will be added.",
          challenge: "Challenge details coming soon.",
          insight: "Insight details coming soon.",
          strategy: "Strategy details coming soon.",
          platform: ["Channels to be confirmed"],
          execution: "Execution details coming soon.",
          outcome: "Outcome details coming soon.",
          placeholder: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setOpen(false);
        reset();
        router.push(`/admin/jobs/${slug}`);
      }
      router.refresh();
    } catch (cause) {
      console.error("Unable to create record", cause);
      setError(cause instanceof Error ? cause.message : "Couldn’t save. Try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={copy.button}
        className={iconOnly
          ? "inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          : LIST_ACTION_CLASS}
      >
        <Plus className={iconOnly ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
        {iconOnly ? null : <span>{copy.button}</span>}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="max-h-[min(70vh,620px)] space-y-4 overflow-y-auto pr-1">
            {type === "update" ? (
              <>
                <div className="space-y-1.5">
                  <span className={LABEL}>Title</span>
                  <Input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} disabled={busy} placeholder="Headline" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Category</span>
                  <Select value={category} onValueChange={(value) => setCategory(value as (typeof UPDATE_CATEGORIES)[number])}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{UPDATE_CATEGORIES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Summary</span>
                  <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} disabled={busy} className={TEXTAREA} placeholder="Short summary" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Source</span>
                  <Input value={sourceName} onChange={(event) => setSourceName(event.target.value)} disabled={busy} />
                </div>
              </>
            ) : type === "resource" ? (
              <>
                <div className="space-y-1.5">
                  <span className={LABEL}>Name</span>
                  <Input autoFocus value={label} onChange={(event) => setLabel(event.target.value)} disabled={busy} placeholder="Resource name" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Group</span>
                  <Input value={group} onChange={(event) => setGroup(event.target.value)} disabled={busy} placeholder="e.g. Internal" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Detail</span>
                  <Input value={meta} onChange={(event) => setMeta(event.target.value)} disabled={busy} placeholder="Short description" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Link</span>
                  <Input value={href} onChange={(event) => setHref(event.target.value)} disabled={busy} placeholder="https://" />
                </div>
              </>
            ) : type === "client" ? (
              <>
                <ImageUploadField label="Avatar" value={profileImage} onChange={setProfileImage} variant="avatar" disabled={busy} />
                <div className="space-y-1.5">
                  <span className={LABEL}>Name</span>
                  <Input autoFocus value={clientName} onChange={(event) => setClientName(event.target.value)} disabled={busy} placeholder="Client name" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Industry</span>
                  <Input value={industry} onChange={(event) => setIndustry(event.target.value)} disabled={busy} placeholder="e.g. Finance" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>First live date</span>
                  <Input type="date" value={clientDate} onChange={(event) => setClientDate(event.target.value)} disabled={busy} />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Description</span>
                  <textarea value={clientDescription} onChange={(event) => setClientDescription(event.target.value)} disabled={busy} className={TEXTAREA} placeholder="Short client description" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <span className={LABEL}>Job title</span>
                  <Input autoFocus value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} disabled={busy} placeholder="Job name" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Client</span>
                  {clients.length > 0 ? (
                    <Select value={jobClientId} onValueChange={setJobClientId} disabled={busy || loadingClients}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={loadingClients ? "Loading clients…" : "Select a client"} /></SelectTrigger>
                      <SelectContent>{clients.map((client) => <SelectItem key={client.slug} value={client.slug}>{client.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <p className="m-0 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">Create a client first, then add a job to it.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Category</span>
                  <Input value={jobCategory} onChange={(event) => setJobCategory(event.target.value)} disabled={busy} placeholder="e.g. Finance" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className={LABEL}>Status</span>
                    <Select value={jobStatus} onValueChange={(value) => setJobStatus(value as JobStatus)} disabled={busy}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{JOB_STATUSES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <span className={LABEL}>Year</span>
                    <Input type="number" value={jobYear} onChange={(event) => setJobYear(event.target.value)} disabled={busy} placeholder="2026" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Live date</span>
                  <Input type="date" value={jobLiveDate} onChange={(event) => setJobLiveDate(event.target.value)} disabled={busy} />
                </div>
              </>
            )}

            {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}

            <DialogFooter>
              <button type="button" onClick={() => handleOpenChange(false)} disabled={busy} className="h-9 rounded-md border border-border px-4 text-xs font-semibold text-foreground transition hover:border-foreground disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={busy || !canSave} className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving…" : `Create ${type}`}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
