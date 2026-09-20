"use client";

import { useState } from "react";
import { FiArrowRight, FiCheck, FiLoader } from "react-icons/fi";
import { useAuth } from "@/components/auth-provider";
import { migrateProductsToCampaigns, type MigrationResult } from "@/lib/firebase/migrate-products";
import { Skeleton } from "@/components/ui/skeleton";

export function MigratePanel() {
  const { user, loading, isAdmin } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      setResult(await migrateProductsToCampaigns());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Migration failed. Check the console.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <Skeleton className="h-5 w-32" role="status" aria-label="Checking access" />;
  if (!user) return <p className="text-[14px] text-muted-foreground">Sign in to continue.</p>;
  if (!isAdmin) return <p className="text-[14px] text-muted-foreground">Admins only — your account can’t run this.</p>;

  return (
    <div className="mt-6 max-w-lg rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-foreground">
        <FiArrowRight aria-hidden="true" className="h-5 w-5" />
        <h2 className="m-0 text-[16px] font-semibold">Move products into campaigns</h2>
      </div>
      <p className="mb-4 mt-1.5 text-[13px] leading-[1.5] text-muted-foreground">
        Adds BBDO West Africa as a client, turns every product into one of its campaigns, and deletes the old product
        records. Product-only detail (owner, objective, goals, KPIs, roadmap) is not carried over. Safe to run again.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={running}
        className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running ? <FiLoader aria-hidden="true" className="h-4 w-4 animate-spin" /> : <FiArrowRight aria-hidden="true" className="h-4 w-4" />}
        {running ? "Migrating…" : "Migrate"}
      </button>

      {result ? (
        <p className="mb-0 mt-4 flex items-center gap-2 text-[13px] font-medium text-[#1a9a4a]">
          <FiCheck aria-hidden="true" className="h-3.5 w-3.5" />
          {result.moved === 0 ? "Nothing to move — already migrated." : `Moved ${result.moved} product${result.moved === 1 ? "" : "s"} into campaigns.`}
        </p>
      ) : null}
      {error ? <p className="mb-0 mt-4 text-[13px] font-medium text-[#d94a3a]">{error}</p> : null}
    </div>
  );
}
