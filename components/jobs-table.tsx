"use client";

import Link from "next/link";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Building2, Eye, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JOB_STATUS_LABELS, byLastModified, jobTitle, type Job } from "@/lib/jobs";
import { jobHref, jobModifiedAt } from "@/lib/jobs";
import { plural, updatedDate } from "@/lib/format";
import { Badge, EmptyState } from "@/components/dashboard/ui";
import { DashboardCardActions } from "@/components/dashboard-card";
import { CARD_MENU_TRIGGER, CardGrid, DesktopTable, ListCard, MobileRow, MobileRows, ROW_ICON_ACTION } from "@/components/dashboard/list-card";
import { ComposeEmail } from "@/components/dashboard/email/email-workspace";
import { TABLE_PRIMARY_ACTION_CLASS } from "@/components/dashboard/table-row-actions";
import { FilterBar, useListView, type FilterTab, type SortOption } from "@/components/dashboard/filter-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { useAuth } from "@/components/auth-provider";
import { QuickCreate, type CreateType } from "@/components/quick-create";
import { firebaseDb } from "@/lib/firebase/client";
import { JOB_POSTINGS_COLLECTION, JOB_POSTING_LINKS_COLLECTION, postingHref } from "@/lib/job-postings";
import { buildMessageHtml, ensureMessageHtml, stripMessageCta } from "@/lib/message-html";
import { loadTemplates } from "@/lib/email/template-store";
import type { SavedTemplate } from "@/lib/email/template-definitions";

const STATUS_TABS: FilterTab<"all" | "active" | "completed" | "archive">[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archive", label: "Archive" },
];

type StatusKey = (typeof STATUS_TABS)[number]["key"];

function jobMatchesStatus(job: Job, status: StatusKey) {
  if (status === "all") return true;
  if (status === "active") return job.status === "active";
  if (status === "completed") return job.status === "completed";
  return job.status === "archived";
}

const SORTS: SortOption<"recent" | "name" | "client" | "modified">[] = [
  { key: "modified", label: "Last modified" },
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Name (A–Z)" },
  { key: "client", label: "Client (A–Z)" },
];

type SortKey = (typeof SORTS)[number]["key"];

function liveTime(job: Job): number {
  return job.liveAt ? Date.parse(`${job.liveAt.date}T00:00:00Z`) : 0;
}

type JobEmail = { id: number; template: SavedTemplate; templates: SavedTemplate[]; publicPosting: boolean };

function JobSendButton({ job, onClick, busy, className }: { job: Job; onClick: () => void; busy: boolean; className: string }) {
  return <button type="button" onClick={onClick} disabled={busy} aria-label={`Send ${jobTitle(job)}`} title="Send job" className={className}><Send className="h-4 w-4" aria-hidden="true" /></button>;
}

export function JobsTable({ jobs, createType }: { jobs: Job[]; createType?: CreateType }) {
  const { actualUser, isAdmin, role } = useAuth();
  const canSend = role === "admin" || role === "manager";
  const [status, setStatus] = useState<StatusKey>("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("modified");
  const [view, setView] = useListView("jobs");
  const [jobEmail, setJobEmail] = useState<JobEmail | null>(null);
  const [sendingJobSlug, setSendingJobSlug] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [postingLinks, setPostingLinks] = useState<Record<string, string>>({});
  const [postingLinksLoading, setPostingLinksLoading] = useState(true);
  const [postingLinksError, setPostingLinksError] = useState(false);
  const [unavailableShareJob, setUnavailableShareJob] = useState<Job | null>(null);
  const composerSaveRef = useRef<(() => Promise<boolean>) | null>(null);
  const composerIdRef = useRef(0);
  const registerComposerSave = useCallback((save: (() => Promise<boolean>) | null) => { composerSaveRef.current = save; }, []);

  useEffect(() => {
    if (!canSend) return;
    let active = true;
    setPostingLinksLoading(true);
    getDocs(collection(firebaseDb, JOB_POSTING_LINKS_COLLECTION))
      .then((snapshot) => {
        if (!active) return;
        const links: Record<string, string> = {};
        snapshot.forEach((item) => {
          const postingId = item.data().postingId;
          if (typeof postingId === "string" && postingId) links[item.id] = postingId;
        });
        setPostingLinks(links);
        setPostingLinksError(false);
      })
      .catch(() => { if (active) setPostingLinksError(true); })
      .finally(() => { if (active) setPostingLinksLoading(false); });
    return () => { active = false; };
  }, [canSend]);

  const openJobEmail = async (job: Job) => {
    if (sendingJobSlug) return;
    setSendingJobSlug(job.slug);
    setShareError(null);
    try {
      if (composerSaveRef.current && !await composerSaveRef.current()) {
        setShareError("Save the current draft before opening another job.");
        return;
      }

      let posting: { id: string; headline: string } | null = null;
      try {
        const link = await getDoc(doc(firebaseDb, JOB_POSTING_LINKS_COLLECTION, job.slug));
        const postingId = link.data()?.postingId;
        if (typeof postingId === "string" && postingId) {
          const snapshot = await getDoc(doc(firebaseDb, JOB_POSTINGS_COLLECTION, postingId));
          const data = snapshot.data();
          if (data?.status === "open" && typeof data.headline === "string" && data.headline.trim()) {
            posting = { id: postingId, headline: data.headline.trim() };
          }
        }
      } catch {
        setShareError("Couldn’t check the public posting. This email will use the signed-in job link.");
      }

      const loadedTemplates = await loadTemplates();
      const shareTemplate = loadedTemplates.find((item) => item.key === "share-job" && item.published);
      if (!shareTemplate) {
        setShareError("Publish the Share job template before sending a job.");
        return;
      }

      const title = posting?.headline ?? jobTitle(job);
      const href = posting ? postingHref(posting.id) : jobHref(job);
      const actionLabel = shareTemplate.actionLabel || "View job";
      const template: SavedTemplate = {
        ...shareTemplate,
        subject: `${shareTemplate.subject.trim()}: ${title}`.slice(0, 200),
        message: buildMessageHtml(`${stripMessageCta(shareTemplate.message)}${ensureMessageHtml(title)}`, actionLabel, href),
        actionLabel,
        actionHref: href,
        heading: title,
      };
      const templates = loadedTemplates.map((item) => item.key === template.key ? template : item);
      setJobEmail({ id: ++composerIdRef.current, template, templates, publicPosting: Boolean(posting) });
    } catch {
      setShareError("Couldn’t prepare the job email. Please try again.");
    } finally {
      setSendingJobSlug(null);
    }
  };

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...[...new Set(jobs.map((job) => job.category))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [jobs],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      const matchesStatus = jobMatchesStatus(job, status);
      const matchesCategory = category === "all" || job.category === category;
      const matchesSearch =
        !query ||
        [job.title, job.name, job.clientName, job.category, job.leadUserId]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "client") return a.clientName.localeCompare(b.clientName);
      if (sort === "modified") return byLastModified(a, b);
      return liveTime(b) - liveTime(a);
    });
  }, [jobs, status, category, search, sort]);

  return (
    <>
      <FilterBar
        panelId="job-panel"
        tabs={STATUS_TABS}
        activeTab={status}
        onTabChange={setStatus}
        tabsLabel="Status"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search jobs"
        filters={[
          { label: "Category", value: category, onChange: setCategory, options: categoryOptions },
        ]}
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "job")}
        view={view}
        onViewChange={setView}
        actions={createType ? <QuickCreate type={createType} /> : null}
      />

      {shareError ? <p role="alert" className="m-0 mb-3 text-sm text-destructive">{shareError}</p> : null}

      <section id="job-panel" aria-label="Jobs">
        {visible.length > 0 ? (
          view === "cards" ? (
            <CardGrid>
              {visible.map((job) => (
                <ListCard
                  key={job.slug}
                  href={jobHref(job, true)}
                  image={job.image}
                  title={jobTitle(job)}
                  subtitle={updatedDate(jobModifiedAt(job))}
                  menu={canSend ? <div className="flex items-center gap-1"><JobSendButton job={job} onClick={() => void openJobEmail(job)} busy={Boolean(sendingJobSlug)} className={CARD_MENU_TRIGGER} /><DashboardCardActions collection="jobs" slug={job.slug} titleField="title" title={jobTitle(job)} /></div> : null}
                />
              ))}
            </CardGrid>
          ) : (
            <>
            <MobileRows>
              {visible.map((job) => (
                <MobileRow
                  key={job.slug}
                  href={jobHref(job, true)}
                  image={job.image}
                  title={jobTitle(job)}
                  chip={job.clientName}
                  chipIcon={<Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  detail={[job.category, updatedDate(jobModifiedAt(job))].filter(Boolean).join(" · ")}
                  status={<Badge tone={job.status === "active" ? "active" : "neutral"}>{JOB_STATUS_LABELS[job.status]}</Badge>}
                  actions={<><Link href={jobHref(job, true)} aria-label={`View ${jobTitle(job)}`} className={ROW_ICON_ACTION}><Eye className="h-5 w-5" aria-hidden="true" /></Link>{canSend ? <JobSendButton job={job} onClick={() => void openJobEmail(job)} busy={Boolean(sendingJobSlug)} className={ROW_ICON_ACTION} /> : null}</>}
                  menu={isAdmin ? <DashboardCardActions collection="jobs" slug={job.slug} titleField="title" title={jobTitle(job)} triggerClassName={ROW_ICON_ACTION} /> : null}
                />
              ))}
            </MobileRows>
            <DesktopTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Updated</TableHead>
                    {canSend ? <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((job) => (
                    <ClickableTableRow key={job.slug} href={jobHref(job, true)} label={`Open job ${jobTitle(job)}`}>
                      <TableCell className="font-semibold">
                        <Link href={jobHref(job, true)} className="text-foreground no-underline hover:text-primary focus-visible:text-primary">
                          {jobTitle(job)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{job.clientName}</TableCell>
                      <TableCell><Badge tone={job.status === "active" ? "active" : "neutral"}>{JOB_STATUS_LABELS[job.status]}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{job.category}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{updatedDate(jobModifiedAt(job))}</TableCell>
                      {canSend ? <TableCell className="w-[1%] whitespace-nowrap text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1">
                          {postingLinks[job.slug] ? (
                            <Link href={postingHref(postingLinks[job.slug])} target="_blank" rel="noopener noreferrer" aria-label={`Preview share link for ${jobTitle(job)}`} title="Preview share link" className={TABLE_PRIMARY_ACTION_CLASS}>
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          ) : (
                            <button type="button" onClick={() => setUnavailableShareJob(job)} disabled={postingLinksLoading} aria-label={`Preview share link for ${jobTitle(job)}`} title="Preview share link" className={TABLE_PRIMARY_ACTION_CLASS}>
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                          <JobSendButton job={job} onClick={() => void openJobEmail(job)} busy={Boolean(sendingJobSlug)} className={TABLE_PRIMARY_ACTION_CLASS} />
                          {isAdmin ? <DashboardCardActions collection="jobs" slug={job.slug} titleField="title" title={jobTitle(job)} variant="table" /> : null}
                        </div>
                      </TableCell> : null}
                    </ClickableTableRow>
                  ))}
                </TableBody>
              </Table>
            </DesktopTable>
            </>
          )
        ) : (
          <EmptyState
            title="No jobs match"
            description="Try a different search term, status filter or clear your filters."
          />
        )}
      </section>
      <Dialog open={Boolean(unavailableShareJob)} onOpenChange={(open) => { if (!open) setUnavailableShareJob(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share link unavailable</DialogTitle>
            <DialogDescription>{postingLinksError ? "Couldn’t load the job share links. Try again later." : "This job has no share link yet. Open the job and use Share to create one."}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setUnavailableShareJob(null)} className="h-9 rounded-md border border-border px-4 text-sm">Close</button>
            {unavailableShareJob && !postingLinksError ? <Link href={jobHref(unavailableShareJob, true)} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground no-underline">Open job</Link> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {jobEmail ? (
        <ComposeEmail
          key={jobEmail.id}
          templates={jobEmail.templates}
          initialTemplate={jobEmail.template}
          staffUid={actualUser?.uid ?? ""}
          onDraftSaved={() => {}}
          onDraftRemoved={() => {}}
          onSent={() => setJobEmail(null)}
          onClose={() => setJobEmail(null)}
          registerSave={registerComposerSave}
          showGroups={false}
          allowEmailAddresses={jobEmail.publicPosting}
        />
      ) : null}
    </>
  );
}
