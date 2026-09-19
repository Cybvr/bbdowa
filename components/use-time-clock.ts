"use client";

import * as React from "react";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { TIME_ENTRIES_COLLECTION, openShift, sortByClockIn, type TimeEntry } from "@/lib/time-tracking";

/**
 * Shared clock in / clock out state, used by the Time page and the home
 * dashboard widget. Loads the signed-in person's shifts, tracks the open
 * one, and ticks a live clock once a minute.
 */
export function useTimeClock() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = React.useState<TimeEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  const load = React.useCallback(async (uid: string) => {
    const snapshot = await getDocs(
      query(collection(firebaseDb, TIME_ENTRIES_COLLECTION), where("uid", "==", uid)),
    );
    const rows = snapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<TimeEntry, "id">),
    }));
    setEntries(sortByClockIn(rows));
  }, []);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    load(user.uid)
      .catch((cause) => {
        console.error("Unable to load time entries from Firestore", cause);
        if (active) setError("Unable to load your time entries.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user, load]);

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const current = openShift(entries);

  const clockIn = React.useCallback(async () => {
    if (!user || current || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addDoc(collection(firebaseDb, TIME_ENTRIES_COLLECTION), {
        uid: user.uid,
        name: user.name ?? user.email ?? null,
        clockInAt: new Date().toISOString(),
        clockOutAt: null,
      });
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to clock in", cause);
      setError("Unable to clock in. Try again.");
    } finally {
      setBusy(false);
    }
  }, [user, current, busy, load]);

  const clockOut = React.useCallback(async () => {
    if (!user || !current || busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, TIME_ENTRIES_COLLECTION, current.id), {
        clockOutAt: new Date().toISOString(),
      });
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to clock out", cause);
      setError("Unable to clock out. Try again.");
    } finally {
      setBusy(false);
    }
  }, [user, current, busy, load]);

  return {
    signedIn: Boolean(user),
    authLoading,
    entries,
    current,
    loading,
    error,
    busy,
    now,
    clockIn,
    clockOut,
  };
}
