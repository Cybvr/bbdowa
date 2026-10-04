export type CreatorWorkHistoryDraft = {
  role: string;
  company: string;
  period: string;
  location?: string;
};

export type CreatorDraft = {
  name: string;
  category: string;
  title: string;
  department: string;
  location: string;
  email: string | null;
  phone: string | null;
  profileImage: string | null;
  portfolio: string | null;
  linkedin: string | null;
  instagram: string | null;
  niche: string | null;
  referralSource: string | null;
  followerCount: string | null;
  followerPlatform: string | null;
  yearsActive: number | null;
  craftNote: string;
  workHistory: CreatorWorkHistoryDraft[];
};

export type ClientDraft = {
  name: string;
  industry: string;
  date: string | null;
  profileImage: string | null;
  description: string | null;
  targetAudience: string | null;
};

export type JobDraft = {
  name: string;
  clientName: string;
  category: string;
  status: "live" | "pitch" | "completed";
  year: number | null;
  liveAt: string | null;
  summary: string;
  challenge: string;
  insight: string;
  strategy: string;
  platform: string[];
  execution: string;
  outcome: string;
  target: string;
};

export type TaskDraft = {
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  clientId: string | null;
  clientName: string | null;
  jobId: string | null;
  jobName: string | null;
  dueDate: string | null;
  status: "todo" | "in_progress" | "done";
};

export type ManagedCollection = "users" | "clients" | "jobs";

/** Small, non-sensitive snapshot of live app records supplied to Njeri for staff queries. */
export type NjeriWorkspaceContext = {
  clients: Array<{ name: string; slug: string; industry: string; description: string; targetAudience: string }>;
  creators: Array<{ name: string; slug: string; uid: string; category: string; title: string; instagram: string; niche: string; followerCount: string; availability: string; referralSource: string; clearance: string; vetted: boolean; workedOn: string[]; workHistory: CreatorWorkHistoryDraft[]; dayRate: string; rateMin: number | null; rateCurrency: string; yearsActive: number | null; craftNote: string }>;
  jobs: Array<{ name: string; slug: string; clientName: string; category: string; status: string; summary: string }>;
  tasks: Array<{ id: string; title: string; description: string; assignedTo: string; assignedToName: string; clientName: string; jobName: string; status: string; dueDate: string }>;
  documents: Array<{ id: string; title: string; status: string; assignedTo: string; assignedToName: string; createdAt: string; signedAt: string; signedName: string; body?: string }>;
  trackedHours: Array<{ uid: string; name: string; jobName: string; activity: string; minutes: number; startedAt: string }>;
};

export type NjeriRecordChange = string | number | boolean | null | string[];

export type NjeriActionProposal =
  | {
      type: "create_creator";
      record: CreatorDraft;
      sources: string[];
      status?: "pending" | "saving" | "saved" | "failed";
      error?: string;
    }
  | {
      type: "create_client";
      record: ClientDraft;
      sources: string[];
      status?: "pending" | "saving" | "saved" | "failed";
      error?: string;
    }
  | {
      type: "create_job";
      record: JobDraft;
      sources: string[];
      status?: "pending" | "saving" | "saved" | "failed";
      error?: string;
    }
  | {
      type: "update_record";
      collection: ManagedCollection;
      recordId: string;
      label: string;
      changes: Record<string, NjeriRecordChange>;
      sources: string[];
      status?: "pending" | "saving" | "saved" | "failed";
      error?: string;
    }
  | {
      type: "delete_record";
      collection: ManagedCollection;
      recordId: string;
      label: string;
      sources: string[];
      status?: "pending" | "saving" | "saved" | "failed";
      error?: string;
    }
  | {
      type: "create_task";
      record: TaskDraft;
      sources: string[];
      status?: "pending" | "saving" | "saved" | "failed";
      error?: string;
    }
  | {
      type: "update_task";
      taskId: string;
      label: string;
      changes: Partial<TaskDraft>;
      sources: string[];
      status?: "pending" | "saving" | "saved" | "failed";
      error?: string;
    }
  | {
      type: "delete_task";
      taskId: string;
      label: string;
      sources: string[];
      status?: "pending" | "saving" | "saved" | "failed";
      error?: string;
    };

export type NjeriResponse = {
  answer: string;
  action?: NjeriActionProposal | null;
};
