// A user can hold more than one directory role.
export type UserRole = "admin" | "manager" | "creator";
export type UserAccountRole = UserRole | "pending";

export type CreatorAvailability = "open" | "busy" | "unconfirmed";
export type RateCurrency = "NGN" | "USD";

export type CreatorClearance = "cleared" | "pending";

export const DEFAULT_CREATOR_CATEGORIES = ["Art", "Content", "Film", "Strategy", "UX", "Writing"] as const;

export const CREATOR_RATE_OPTIONS: Record<RateCurrency, readonly { value: number; label: string }[]> = {
  NGN: [
    { value: 10000, label: "₦10,000–₦25,000 / day" },
    { value: 25000, label: "₦25,000–₦50,000 / day" },
    { value: 50000, label: "₦50,000–₦100,000 / day" },
    { value: 100000, label: "₦100,000–₦200,000 / day" },
    { value: 200000, label: "₦200,000+ / day" },
  ],
  USD: [
    { value: 50, label: "$50–$100 / day" },
    { value: 100, label: "$100–$250 / day" },
    { value: 250, label: "$250–$500 / day" },
    { value: 500, label: "$500–$1,000 / day" },
    { value: 1000, label: "$1,000+ / day" },
  ],
};

export function creatorRateLabel(currency: RateCurrency, rateMin: number | null): string {
  return CREATOR_RATE_OPTIONS[currency].find((option) => option.value === rateMin)?.label ?? "";
}

export const REFERRAL_SOURCES = [
  "Friend / Family",
  "Colleague / Co-worker",
  "Google Search",
  "Social Media",
  "Advertisement",
  "Event / Conference",
  "Other",
] as const;

export type CreatorWorkHistory = {
  role: string;
  company: string;
  period: string;
  location?: string;
};

// One flat user shape. Every user has the same fields, and `roles` says which
// directory surfaces they belong to. `role` remains as the primary-role
// compatibility field for existing Firestore records.
export type User = {
  slug: string;
  /** Admin switch: true sends the person through onboarding, false skips it. Unset uses the default rule. */
  onboardingRequired?: boolean | null;
  /** Set when the person finishes onboarding. */
  onboardingCompletedAt?: unknown;
  /** "complete" or "skipped" once the person has finished or skipped onboarding. */
  onboardingStatus?: string | null;
  onboardingSkippedAt?: unknown;
  /** Firebase Auth uid, present once this person has signed in and holds an account. */
  uid?: string | null;
  name: string;
  /** What the person likes to be called, if different from their full name. */
  preferredName?: string | null;
  /** Primary role retained for older records and auth compatibility. */
  role: UserAccountRole;
  /** Every directory role this person holds. */
  roles: UserRole[];
  /** Job title (agency staff). */
  title: string;
  /** Department (agency staff). */
  department: string;
  /** Creator discipline. Not a closed set — admins can add new ones from the edit form. */
  category: string;
  tags: string[];
  location: string;
  entity: "Freelancer" | "Studio";
  /** Working day-rate band used for this directory prototype; confirm before engagement. */
  dayRate: string;
  /** Bottom of the day-rate band, in rateCurrency units. */
  rateMin: number | null;
  rateCurrency: "NGN" | "USD";
  /** Frontend display flag; omitted records default to hiding the rate. */
  hideRate?: boolean;
  /** Payment terms agreed with finance. */
  terms: string;
  availability: CreatorAvailability;
  /** Cleared = signed off by MD, finance and creative. */
  clearance: CreatorClearance;
  /** Vetted for inclusion in the creator shortlist. */
  vetted?: boolean;
  /** How they heard about us, one of REFERRAL_SOURCES. */
  referralSource?: string | null;
  /** Who inside the agency brought them in and vouches for them. */
  vouchedBy: string;
  /** Agency work they have delivered on. Empty = not yet used. */
  workedOn: string[];
  yearsActive: number | null;
  portfolio: string | null;
  behance?: string | null;
  email: string | null;
  phone: string | null;
  /** Public profile image URL sourced from a researched online profile. */
  profileImage?: string | null;
  /** ISO timestamp for when this creator was added to the directory. */
  addedAt?: string | null;
  /** Public work/project image used for the directory feature tile. */
  featuredImage?: string | null;
  /** Public professional history researched from the supplied profile and linked sources. */
  workHistory?: CreatorWorkHistory[];
  linkedin?: string | null;
  instagram?: string | null;
  /** Contact guidance shown when a direct email is unavailable or incomplete. */
  contactNote?: string | null;
  /** Optional public audience metadata; do not infer age or gender. */
  followerCount?: string | null;
  followerPlatform?: string | null;
  gender?: string | null;
  age?: number | null;
  niche?: string | null;
  lastEngaged?: string | null;
  /** Creative officer's note on the craft. */
  craftNote: string;
};

// Team members and creators are both just users.
export type TeamUser = User;
export type Creator = User;

/** Normalize records written before the multi-role model was introduced. */
export function normalizeUser(user: User): User {
  const roles = userRoles(user);
  return {
    ...user,
    role: user.role ?? roles[0] ?? "pending",
    roles,
  };
}

export function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "manager" || value === "creator";
}

export function userRoles(user: Pick<User, "roles" | "role">): UserRole[] {
  const roles = (user.roles ?? []).filter(isUserRole);
  return roles.length ? roles : isUserRole(user.role) ? [user.role] : [];
}

/** Agency staff = admin or manager. A staff member may also be a creator. */
export function isTeamUser(user: User): boolean {
  return userRoles(user).some((role) => role === "admin" || role === "manager");
}

export function isCreatorUser(user: User): boolean {
  return userRoles(user).includes("creator");
}

/** Known categories plus the defaults, so an admin picks from what's in use and can still add a new one. */
export function creatorCategoryOptions(users: Pick<User, "category">[]): string[] {
  const known = new Set([...DEFAULT_CREATOR_CATEGORIES, ...users.map((user) => user.category)]);
  known.delete("");
  return [...known].sort();
}

/** Working rate for comparing dollar quotes against naira budgets. Update when the rate moves. */
export const NGN_PER_USD = 1500;

export function rateFloorNgn(creator: Creator): number {
  if (creator.rateMin === null) return Number.POSITIVE_INFINITY;
  return creator.rateCurrency === "USD" ? creator.rateMin * NGN_PER_USD : creator.rateMin;
}

export function baseCity(location: string): string {
  return location.split(" /")[0];
}

export const CREATOR_NEW_WINDOW_DAYS = 30;

export function creatorAddedTimestamp(creator: Creator): number {
  return creator.addedAt ? Date.parse(creator.addedAt) : 0;
}

export function isCreatorNew(creator: Creator, now = Date.now()): boolean {
  const added = creatorAddedTimestamp(creator);
  if (!added) return false;
  const age = now - added;
  return age >= 0 && age <= CREATOR_NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function creatorHref(slug: string): string {
  return `/dashboard/discover/${slug}`;
}

/** Job teams use directory slugs where available, or a namespaced account UID. */
export function jobTeamKey(user: Pick<User, "slug" | "uid">): string | null {
  const slug = user.slug?.trim();
  if (slug) return slug;
  const uid = user.uid?.trim();
  return uid ? `uid:${uid}` : null;
}

/** Match either identity so an existing UID assignment survives a later slug edit. */
export function matchesJobTeamKey(user: Pick<User, "slug" | "uid">, key: string): boolean {
  return Boolean(key && ((user.slug && user.slug === key) || (user.uid && `uid:${user.uid}` === key)));
}

export function userHref(user: User, surface: "team" | "creator" = "creator"): string {
  const identifier = encodeURIComponent(user.slug || user.uid || "");
  return surface === "creator"
    ? `/dashboard/discover/${identifier}`
    : `/dashboard/people/${identifier}`;
}

export function userInitials(user: User): string {
  return user.name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
