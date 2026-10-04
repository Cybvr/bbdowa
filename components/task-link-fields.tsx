"use client";

import { useEffect, useId, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readJobsFromFirestore, readClientsFromFirestore } from "@/lib/firebase/client-content";
import type { Job } from "@/lib/jobs";
import type { Client } from "@/lib/clients";

const NO_SELECTION = "__none__";

export function useTaskLinkOptions() {
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([readClientsFromFirestore(), readJobsFromFirestore()])
      .then(([nextClients, nextJobs]) => {
        if (!active) return;
        setClients(nextClients);
        setJobs(nextJobs);
      })
      .catch((cause) => console.error("Unable to load task client and job options", cause))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { clients, jobs, loading };
}

export function TaskClientJobFields({
  clientId,
  jobId,
  clients,
  jobs,
  disabled = false,
  inlineLabels = false,
  onClientChange,
  onJobChange,
}: {
  clientId: string | null;
  jobId: string | null;
  clients: Client[];
  jobs: Job[];
  disabled?: boolean;
  inlineLabels?: boolean;
  onClientChange: (clientId: string | null) => void;
  onJobChange: (jobId: string | null) => void;
}) {
  const id = useId();
  const linkedJobs = jobs.filter((job) => job.clientId === clientId);

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
        <label className={`${inlineLabels ? "" : "block "}text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground`} htmlFor={`${id}-job`}>Job</label>
        <Select value={jobId ?? NO_SELECTION} onValueChange={(value) => onJobChange(value === NO_SELECTION ? null : value)} disabled={disabled || !clientId}>
          <SelectTrigger id={`${id}-job`} className="min-w-0 rounded-md border border-input bg-background"><SelectValue placeholder={clientId ? "Choose a job" : "Choose a client first"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SELECTION}>No job</SelectItem>
            {linkedJobs.map((job) => <SelectItem key={job.slug} value={job.slug}>{job.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
