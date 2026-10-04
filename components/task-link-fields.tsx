"use client";

import { useEffect, useId, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readCampaignsFromFirestore, readClientsFromFirestore } from "@/lib/firebase/client-content";
import type { Campaign } from "@/lib/campaigns";
import type { Client } from "@/lib/clients";

const NO_SELECTION = "__none__";

export function useTaskLinkOptions() {
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([readClientsFromFirestore(), readCampaignsFromFirestore()])
      .then(([nextClients, nextCampaigns]) => {
        if (!active) return;
        setClients(nextClients);
        setCampaigns(nextCampaigns);
      })
      .catch((cause) => console.error("Unable to load task client and campaign options", cause))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { clients, campaigns, loading };
}

export function TaskClientCampaignFields({
  clientId,
  campaignId,
  clients,
  campaigns,
  disabled = false,
  inlineLabels = false,
  onClientChange,
  onCampaignChange,
}: {
  clientId: string | null;
  campaignId: string | null;
  clients: Client[];
  campaigns: Campaign[];
  disabled?: boolean;
  inlineLabels?: boolean;
  onClientChange: (clientId: string | null) => void;
  onCampaignChange: (campaignId: string | null) => void;
}) {
  const id = useId();
  const linkedCampaigns = campaigns.filter((campaign) => campaign.clientId === clientId);

  return (
    <>
      <div className={inlineLabels ? "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2" : "space-y-1.5"}>
        <label className={`${inlineLabels ? "" : "block "}text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground`} htmlFor={`${id}-client`}>Client</label>
        <Select value={clientId ?? NO_SELECTION} onValueChange={(value) => onClientChange(value === NO_SELECTION ? null : value)} disabled={disabled}>
          <SelectTrigger id={`${id}-client`} className="min-w-0 rounded-md border border-input bg-background"><SelectValue placeholder="Choose a client" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SELECTION}>No client</SelectItem>
            {clients.map((client) => <SelectItem key={client.slug} value={client.slug}>{client.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className={inlineLabels ? "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2" : "space-y-1.5"}>
        <label className={`${inlineLabels ? "" : "block "}text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground`} htmlFor={`${id}-campaign`}>Job</label>
        <Select value={campaignId ?? NO_SELECTION} onValueChange={(value) => onCampaignChange(value === NO_SELECTION ? null : value)} disabled={disabled || !clientId}>
          <SelectTrigger id={`${id}-campaign`} className="min-w-0 rounded-md border border-input bg-background"><SelectValue placeholder={clientId ? "Choose a job" : "Choose a client first"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SELECTION}>No job</SelectItem>
            {linkedCampaigns.map((campaign) => <SelectItem key={campaign.slug} value={campaign.slug}>{campaign.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
