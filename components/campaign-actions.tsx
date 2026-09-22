"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { EditSheet, ImageUploadField, SelectField, TextField, TextareaField } from "@/components/detail-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Campaign } from "@/lib/campaigns";

export function CampaignActions({ campaign, compactMenu = false }: { campaign: Campaign; compactMenu?: boolean }) {
  const router = useRouter();
  const { users } = useFirestoreUsers();
  const leadOptions = React.useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const [name, setName] = React.useState(campaign.name ?? "");
  const [title, setTitle] = React.useState(campaign.campaign ?? "");
  const [clientName, setClientName] = React.useState(campaign.clientName ?? "");
  const [category, setCategory] = React.useState(campaign.category ?? "");
  const [status, setStatus] = React.useState(campaign.status ?? "pitch");
  const [year, setYear] = React.useState(campaign.year != null ? String(campaign.year) : "");
  const [leadUserId, setLeadUserId] = React.useState(campaign.leadUserId ?? "");
  const [fee, setFee] = React.useState(campaign.fee ?? "");
  const [target, setTarget] = React.useState(campaign.target ?? "");
  const [result, setResult] = React.useState(campaign.result ?? "");
  const [image, setImage] = React.useState(campaign.image ?? "");
  const [imageAlt, setImageAlt] = React.useState(campaign.imageAlt ?? "");
  const [summary, setSummary] = React.useState(campaign.summary ?? "");
  const [challenge, setChallenge] = React.useState(campaign.challenge ?? "");
  const [insight, setInsight] = React.useState(campaign.insight ?? "");
  const [strategy, setStrategy] = React.useState(campaign.strategy ?? "");
  const [platform, setPlatform] = React.useState((campaign.platform ?? []).join(", "));
  const [execution, setExecution] = React.useState(campaign.execution ?? "");
  const [outcome, setOutcome] = React.useState(campaign.outcome ?? "");

  const save = async () => {
    const parsedYear = year.trim() ? Number(year) : null;
    await updateDoc(doc(firebaseDb, "campaigns", campaign.slug), {
      name: name.trim(),
      campaign: title.trim() || name.trim(),
      clientName: clientName.trim(),
      category: category.trim(),
      status,
      year: Number.isFinite(parsedYear as number) ? parsedYear : null,
      leadUserId: leadUserId.trim() || null,
      fee: fee.trim(),
      target: target.trim(),
      result: result.trim(),
      image: image.trim(),
      imageAlt: imageAlt.trim(),
      summary: summary.trim(),
      challenge: challenge.trim(),
      insight: insight.trim(),
      strategy: strategy.trim(),
      platform: platform.split(",").map((item) => item.trim()).filter(Boolean),
      execution: execution.trim(),
      outcome: outcome.trim(),
      placeholder: false,
      updatedAt: serverTimestamp(),
    });
    router.refresh();
  };

  const remove = async () => {
    await deleteDoc(doc(firebaseDb, "campaigns", campaign.slug));
    router.push("/dashboard/campaigns");
  };

  return (
    <EditSheet
      title="Edit campaign"
      description={campaign.campaign ?? campaign.name}
      onSave={save}
      onDelete={remove}
      deleteConfirm="Delete this campaign? This can’t be undone."
      trigger={compactMenu ? (open, removeFromMenu) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${campaign.campaign ?? campaign.name}`}
              className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onSelect={open}><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={removeFromMenu}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : undefined}
    >
      <ImageUploadField label="Cover image" value={image} onChange={setImage} />
      <TextField label="Client (brand)" value={name} onChange={setName} />
      <TextField label="Campaign title" value={title} onChange={setTitle} />
      <TextField label="Client name" value={clientName} onChange={setClientName} />
      <TextField label="Category" value={category} onChange={setCategory} />
      <SelectField
        label="Status"
        value={status}
        onChange={(value) => setStatus(value as Campaign["status"])}
        options={[
          { value: "live", label: "Live" },
          { value: "pitch", label: "Pitch" },
          { value: "completed", label: "Completed" },
        ]}
      />
      <TextField label="Year" value={year} onChange={setYear} type="number" />
      <SelectField
        label="Campaign lead"
        value={leadUserId || "unassigned"}
        onChange={(value) => setLeadUserId(value === "unassigned" ? "" : value)}
        options={[
          { value: "unassigned", label: "Unassigned" },
          ...leadOptions.map((person) => ({ value: person.slug, label: person.name })),
        ]}
      />
      <TextField label="Fee" value={fee} onChange={setFee} />
      <TextField label="Target" value={target} onChange={setTarget} />
      <TextField label="Result so far" value={result} onChange={setResult} />
      <TextField label="Cover image alt text" value={imageAlt} onChange={setImageAlt} />
      <TextareaField label="Summary" value={summary} onChange={setSummary} />
      <TextareaField label="Challenge" value={challenge} onChange={setChallenge} />
      <TextareaField label="Insight" value={insight} onChange={setInsight} />
      <TextareaField label="Strategy" value={strategy} onChange={setStrategy} />
      <TextField label="Platform (comma separated)" value={platform} onChange={setPlatform} />
      <TextareaField label="Execution" value={execution} onChange={setExecution} />
      <TextareaField label="Outcome" value={outcome} onChange={setOutcome} />
    </EditSheet>
  );
}
