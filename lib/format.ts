const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats an ISO `YYYY-MM-DD` string deterministically, so server and client agree. */
export function longDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  return LONG_DATE.format(new Date(Date.UTC(year, month - 1, day)));
}

export function plural(count: number, singular: string, suffix = "s"): string {
  return `${count} ${singular}${count === 1 ? "" : suffix}`;
}

/** Last-updated date from an ISO string or a Firestore Timestamp. */
export function updatedDate(value: unknown): string {
  const iso = typeof value === "string" ? value
    : value && typeof value === "object" && "toDate" in value ? (value as { toDate: () => Date }).toDate().toISOString()
    : "";
  return longDate(iso.slice(0, 10) || null);
}
