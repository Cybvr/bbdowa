"use client";

import * as React from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { firebaseDb } from "@/lib/firebase/client";
import { isCreatorUser, type User } from "@/lib/users";

export function ClientCreatorAddAction({
  campaignId,
  clientName,
  creators,
  selectedSlugs,
  onSaved,
}: {
  campaignId: string | null;
  clientName: string;
  creators: User[];
  selectedSlugs: string[];
  onSaved: (creatorSlugs: string[]) => void;
}) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [draftSlugs, setDraftSlugs] = React.useState<string[]>(selectedSlugs);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const availableCreators = React.useMemo(
    () =>
      creators
        .filter(isCreatorUser)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [creators],
  );
  const visibleCreators = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return availableCreators;
    return availableCreators.filter((creator) =>
      [creator.name, creator.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [availableCreators, query]);

  if (!isAdmin) return null;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraftSlugs(selectedSlugs);
      setQuery("");
      setError(null);
    }
  };

  const toggleCreator = (creatorSlug: string) => {
    setDraftSlugs((current) =>
      current.includes(creatorSlug)
        ? current.filter((slug) => slug !== creatorSlug)
        : [...current, creatorSlug],
    );
  };

  const save = async () => {
    if (!campaignId || busy) return;
    setBusy(true);
    setError(null);

    try {
      await updateDoc(doc(firebaseDb, "campaigns", campaignId), {
        creatorSlugs: draftSlugs,
        updatedAt: serverTimestamp(),
      });
      onSaved(draftSlugs);
      setOpen(false);
    } catch (cause) {
      console.error("Unable to update client creators", cause);
      setError("Couldn’t update the creators. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!campaignId}
        title={campaignId ? undefined : "Create a campaign before adding creators"}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        Add
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add creators</DialogTitle>
            <DialogDescription>Select the creators assigned to {clientName}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search creators"
              aria-label="Search creators"
            />
            <div className="max-h-[min(50vh,420px)] overflow-y-auto rounded-lg border border-border">
              {visibleCreators.length ? (
                visibleCreators.map((creator) => {
                  const checked = draftSlugs.includes(creator.slug);
                  return (
                    <label
                      key={creator.slug}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-muted/60"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCreator(creator.slug)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{creator.name}</span>
                        {creator.category ? (
                          <span className="block truncate text-xs text-muted-foreground">{creator.category}</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="m-0 px-4 py-8 text-center text-sm text-muted-foreground">No creators found.</p>
              )}
            </div>
            {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="h-9 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy || !campaignId}
              className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Saving…" : `Save ${draftSlugs.length} creator${draftSlugs.length === 1 ? "" : "s"}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
