"use client";

import * as React from "react";
import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2 } from "lucide-react";
import type { User } from "@/lib/users";

export function BackfillUidsAction({ users }: { users: User[] }) {
  const [isRunning, setIsRunning] = React.useState(false);

  const missing = users.filter((user) => !user.uid);

  const run = async () => {
    setIsRunning(true);
    try {
      const batch = writeBatch(firebaseDb);
      for (const user of missing) {
        const snapshot = await getDocs(query(collection(firebaseDb, "users"), where("slug", "==", user.slug)));
        const ref = snapshot.docs[0]?.ref;
        if (ref) batch.update(ref, { uid: `manual-${user.slug}-${Date.now()}` });
      }
      await batch.commit();
      window.location.reload();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button type="button" variant="outline" disabled={!missing.length || isRunning} onClick={run}>
      {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
      Add uids{missing.length ? ` (${missing.length})` : ""}
    </Button>
  );
}
