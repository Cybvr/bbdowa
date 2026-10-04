// Onboarding for everyone who signs in, staff and creators alike.
//
// Public profile answers go on the person's `users` record, which anyone can
// read. Anything private (emergency contact, manager, start date, the
// equipment checklist) goes in `hrRecords/{uid}`, which only that person and
// staff can read.

export const HR_COLLECTION = "hrRecords";

export type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

export type HrRecord = {
  uid: string;
  managerName: string;
  /** YYYY-MM-DD. */
  startDate: string;
  emergencyContact: EmergencyContact;
  /** Equipment and access items the person has confirmed, keyed by EQUIPMENT_ITEMS key. */
  equipment: Record<string, boolean>;
  updatedAt: string;
};

export const EQUIPMENT_ITEMS = [
  { key: "laptop", label: "Laptop or workstation is set up" },
  { key: "email", label: "Company email works" },
  { key: "chat", label: "Added to the team chat" },
  { key: "drive", label: "Can open the shared drive" },
  { key: "building", label: "Building access card received" },
  { key: "payroll", label: "Payroll details sent to finance" },
] as const;

export type OnboardingTrack = "staff" | "creator";

export type OnboardingStep = "profile" | "work" | "hr" | "policies" | "review";

export const STEP_LABELS: Record<OnboardingStep, string> = {
  profile: "Profile",
  work: "Work details",
  hr: "HR essentials",
  policies: "Policies",
  review: "Review",
};

export function stepsFor(track: OnboardingTrack): OnboardingStep[] {
  // Contractor details belong to the creator's own profile, so creators skip HR.
  return track === "staff" ? ["profile", "work", "hr", "policies", "review"] : ["profile", "work", "policies", "review"];
}

/** Creators onboard on the creator track unless they also hold a staff role. */
export function trackFor(data: { type?: unknown; role?: unknown; roles?: unknown }): OnboardingTrack {
  const roles = Array.isArray(data.roles) ? data.roles : [];
  if (data.role === "admin" || data.role === "manager" || roles.includes("admin") || roles.includes("manager")) return "staff";
  return data.type === "creator" || roles.includes("creator") || data.role === "creator" ? "creator" : "staff";
}

export function emptyHrRecord(uid: string): HrRecord {
  return {
    uid,
    managerName: "",
    startDate: "",
    emergencyContact: { name: "", relationship: "", phone: "" },
    equipment: {},
    updatedAt: "",
  };
}
