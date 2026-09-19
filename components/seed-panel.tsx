"use client";

import { useState } from "react";
import { FiDatabase, FiCheck, FiLoader } from "react-icons/fi";
import { useAuth } from "@/components/auth-provider";
import { seedFirestore, SEED_GROUPS, type SeedResult } from "@/lib/firebase/seed";

const TOTAL_DOCS = SEED_GROUPS.reduce((sum, group) => sum + group.docs.length, 0);

export function SeedPanel() {
  const { user, loading, isAdmin } = useAuth();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SeedResult[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResults([]);
    setDone(false);
    try {
      const collected: SeedResult[] = [];
      await seedFirestore((result) => {
        collected.push(result);
        setResults([...collected]);
      });
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Seeding failed. Check the console.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <p className="text-[14px] text-muted-foreground">Checking access…</p>;
  }
  if (!user) {
    return <p className="text-[14px] text-muted-foreground">Sign in to continue.</p>;
  }
  if (!isAdmin) {
    return <p className="text-[14px] text-muted-foreground">Admins only — your account can’t run this.</p>;
  }

  return (
    <div className="max-w-lg rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-foreground">
        <FiDatabase aria-hidden="true" className="h-5 w-5" />
        <h2 className="m-0 text-[16px] font-semibold">Push data to Firebase</h2>
      </div>
      <p className="mb-4 mt-1.5 text-[13px] leading-[1.5] text-muted-foreground">
        Writes the built-in {TOTAL_DOCS} records — clients, campaigns, users, products, blog posts, jobs and
        resources — into Firestore. Safe to run again; it updates existing records rather than duplicating them.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={running}
        className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-semibold text-primary-foreground transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running ? <FiLoader aria-hidden="true" className="h-4 w-4 animate-spin" /> : <FiDatabase aria-hidden="true" className="h-4 w-4" />}
        {running ? "Pushing…" : done ? "Push again" : "Push to Firebase"}
      </button>

      {results.length > 0 ? (
        <ul className="m-0 mt-4 flex list-none flex-col gap-1.5 p-0">
          {results.map((result) => (
            <li key={result.collection} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="flex items-center gap-2 text-foreground">
                <FiCheck aria-hidden="true" className="h-3.5 w-3.5 text-[#1a9a4a]" />
                {result.name}
              </span>
              <span className="text-muted-foreground">{result.count} records</span>
            </li>
          ))}
        </ul>
      ) : null}

      {done ? <p className="mb-0 mt-4 text-[13px] font-medium text-[#1a9a4a]">Done. All records pushed.</p> : null}
      {error ? <p className="mb-0 mt-4 text-[13px] font-medium text-[#d94a3a]">{error}</p> : null}
    </div>
  );
}
