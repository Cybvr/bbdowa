// Moving from "campaigns" to "jobs".
//
// Client jobs used to be stored in the `campaigns` collection, and careers
// openings in `jobs`. The one-off migration (Admin → Overview) moves openings
// to `openings`, copies campaigns into `jobs`, and renames the campaign fields
// on tasks, time entries and payments. Until it has run, the app keeps reading
// and writing the old collections, so nothing looks empty in between.

export const JOBS_COLLECTION = "jobs";
export const LEGACY_JOBS_COLLECTION = "campaigns";
export const OPENINGS_COLLECTION = "openings";
export const LEGACY_OPENINGS_COLLECTION = "jobs";

/** A public doc whose `done` flag says the migration has run. */
export const MIGRATION_COLLECTION = "migrations";
export const MIGRATION_ID = "campaignsToJobs";

export type MigrationState = {
  done: boolean;
  ranAt?: string | null;
  ranBy?: string | null;
  counts?: Record<string, number>;
};

export function collectionsFor(migrated: boolean) {
  return {
    jobs: migrated ? JOBS_COLLECTION : LEGACY_JOBS_COLLECTION,
    openings: migrated ? OPENINGS_COLLECTION : LEGACY_OPENINGS_COLLECTION,
  };
}

/** Emails allowed to run the migration, from NEXT_PUBLIC_SUPER_ADMIN_EMAILS (comma separated). */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
