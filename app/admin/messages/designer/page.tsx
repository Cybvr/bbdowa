"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { confirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/rich-text-editor";
import { loadTemplates, saveTemplate } from "@/lib/email/template-store";
import { TEMPLATE_DEFAULTS, validTemplate, type SavedTemplate } from "@/lib/email/template-definitions";
import { renderMessageEmail } from "@/lib/email/brand";
import { templates, applySavedTemplate, type EmailContent } from "@/lib/email/templates";
import { MESSAGE_AUDIENCES, type MessageAudience } from "@/lib/notifications";
import { extractMessageCta } from "@/lib/message-html";

const sample = { to: "Ada Okafor", by: "Jide Pinheiro", signer: "Ada Okafor", person: "Ada Okafor", from: "Jide Pinheiro", title: "Campaign review", description: "Review the latest campaign assets.", client: "Example client", job: "Example campaign", due: "2026-10-20", signedAt: "2026-10-11", period: "October 2026", message: "Please complete your review.", number: "INV-001", amount: 125000, currency: "NGN", preview: "Can you review the latest update?", company: "Example company", url: "https://bbdowa.com/dashboard" };
const control = "h-11 rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50";

export default function MessageDesigner() {
  const { role, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<SavedTemplate[]>([]);
  const [selected, setSelected] = useState<SavedTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mobile, setMobile] = useState(false);
  const [kind, setKind] = useState<"message" | "transactional">("message");
  const [previewSite, setPreviewSite] = useState("");
  const dirty = selected && JSON.stringify(selected) !== JSON.stringify(rows.find((row) => row.key === selected.key));

  async function load() {
    setLoading(true); setError("");
    try { const loaded = await loadTemplates(); setRows(loaded); setSelected(loaded[0]); }
    catch { setError("Templates could not be loaded. Retry to continue; your saved templates have not been changed."); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (!authLoading && role === "admin") void load(); }, [authLoading, role]);
  useEffect(() => { setPreviewSite(window.location.origin); }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function choose(row: SavedTemplate) {
    if (dirty && !await confirmDialog("Discard your unsaved template changes?", "Discard")) return;
    setSelected(row); setKind(row.kind); setNotice(""); setError("");
  }
  async function save() {
    if (!selected || busy) return;
    setBusy(true); setNotice(""); setError("");
    try { const saved = await saveTemplate(selected); setSelected(saved); setRows((current) => current.map((row) => row.key === saved.key ? saved : row)); setNotice(saved.published ? "Saved and published." : "Draft saved."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The template could not be saved. Try again."); }
    finally { setBusy(false); }
  }
  let preview = "";
  let invalid = false;
  if (selected && previewSite) {
    const base = TEMPLATE_DEFAULTS.find((row) => row.key === selected.key)!;
    invalid = !validTemplate(selected, base);
    if (!invalid) {
      if (selected.kind === "message") {
        preview = renderMessageEmail(selected.subject, selected.message, previewSite);
      }
      else {
        const fn = (templates as unknown as Record<string, (input: typeof sample) => EmailContent>)[selected.key];
        preview = applySavedTemplate(fn({ ...sample, url: `${previewSite}/dashboard` }), { ...selected, published: true }).html;
      }
    }
  }
  if (authLoading) return <main className="p-5" role="status">Loading…</main>;
  if (role !== "admin") return <main className="p-5"><PageHeader title="Message Designer" /><p>Only admins can edit templates.</p></main>;
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-2 sm:px-8">
    <Link href="/admin/messages" className="mb-4 inline-flex min-h-11 items-center text-sm text-muted-foreground">Back to Send message</Link>
    <PageHeader title="Message Designer" description="Create and manage reusable messages." actions={<button className={`${control} bg-primary text-primary-foreground hover:bg-primary/90`} disabled={!selected || loading || busy || invalid} onClick={() => void save()}>{busy ? "Saving…" : "Save template"}</button>} />
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error} {rows.length === 0 && <button className="underline" onClick={() => void load()}>Retry</button>}</p>}
    {notice && <p role="status" className="mt-4 text-sm text-muted-foreground">{notice}</p>}
    {loading ? <p role="status" className="mt-6">Loading templates…</p> : rows.length > 0 && <>
      <div className="my-5 flex flex-wrap gap-2" aria-label="Template types">{(["message", "transactional"] as const).map((type) => <button key={type} className={`${control} ${kind === type ? "bg-muted" : ""}`} aria-pressed={kind === type} disabled={busy} onClick={() => void choose(rows.find((row) => row.kind === type)!)}>{type === "message" ? "Send message presets" : "Automatic emails"}</button>)}</div>
      {selected && <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-label="Template editor" className="min-w-0 space-y-5">
          <label className="block space-y-2"><span className="text-sm font-semibold">Template</span><select className="h-11 w-full rounded-lg border border-input bg-background px-3" value={selected.key} disabled={busy} onChange={(event) => void choose(rows.find((row) => row.key === event.target.value)!)}>{rows.filter((row) => row.kind === kind).map((row) => <option key={row.key} value={row.key}>{row.label}{row.published ? "" : " (draft)"}</option>)}</select></label>
          <label className="block space-y-2"><span className="text-sm font-semibold">Name</span><Input value={selected.label} disabled={busy} maxLength={100} onChange={(event) => setSelected({ ...selected, label: event.target.value })} /></label>
          <label className="block space-y-2"><span className="text-sm font-semibold">Subject</span><Input value={selected.subject} disabled={busy} maxLength={200} onChange={(event) => setSelected({ ...selected, subject: event.target.value })} /></label>
          {kind === "transactional" && <label className="block space-y-2"><span className="text-sm font-semibold">Email heading</span><Input value={selected.heading} disabled={busy} maxLength={200} onChange={(event) => setSelected({ ...selected, heading: event.target.value })} /></label>}
          {kind === "message" ? (
            <div className="space-y-2">
              <RichTextEditor label="Message" value={selected.message} disabled={busy} allowMessageButton onChange={(value) => { const action = extractMessageCta(value); setSelected({ ...selected, message: value, actionLabel: action?.label ?? "", actionHref: action?.href ?? "" }); }} placeholder="Write the message…" />
            </div>
          ) : (
            <label className="block space-y-2"><span className="text-sm font-semibold">Message</span><Textarea className="min-h-56" value={selected.message} disabled={busy} maxLength={5000} onChange={(event) => setSelected({ ...selected, message: event.target.value })} /><span className="block text-sm text-muted-foreground">Available placeholders: {selected.variables.map((key) => `{{${key}}}`).join(", ")}</span></label>
          )}
          {kind === "message" && <>
            <label className="block space-y-2"><span className="text-sm font-semibold">Default audience</span><select className="h-11 w-full rounded-lg border border-input bg-background px-3" value={selected.audience} disabled={busy} onChange={(event) => setSelected({ ...selected, audience: event.target.value as MessageAudience })}>{MESSAGE_AUDIENCES.map((row) => <option key={row.key} value={row.key}>{row.label}</option>)}</select></label>
            <fieldset><legend className="mb-2 text-sm font-semibold">Default delivery</legend><div className="flex flex-wrap gap-5">{(["email", "inApp", "push"] as const).map((key) => <label key={key} className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={selected[key]} disabled={busy} onChange={(event) => setSelected({ ...selected, [key]: event.target.checked })} />{key === "inApp" ? "In-app" : key === "email" ? "Email" : "Push"}</label>)}</div></fieldset>
          </>}
          <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={selected.published} disabled={busy} onChange={(event) => setSelected({ ...selected, published: event.target.checked })} />Published</label>
          {invalid && <p role="alert" className="text-sm text-destructive">Add a name, subject and message. If the message has a button, complete its text and use a Bantaba link beginning with /.</p>}
        </section>
        <section aria-label="Email preview" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="m-0 text-base font-semibold">Preview · example details</h2><button className={control} aria-pressed={mobile} onClick={() => setMobile(!mobile)}>{mobile ? "Desktop preview" : "Mobile preview"}</button></div>
          <iframe title="BBDO email preview" sandbox="" srcDoc={preview} className={`mx-auto h-[740px] max-w-full border-0 bg-muted ${mobile ? "w-[375px]" : "w-full"}`} />
        </section>
      </div>}
    </>}
  </main>;
}
