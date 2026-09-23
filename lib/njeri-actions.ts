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

export type CampaignDraft = {
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

export type ManagedCollection = "users" | "clients" | "campaigns";

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
      type: "create_campaign";
      record: CampaignDraft;
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
    };

export type NjeriResponse = {
  answer: string;
  action?: NjeriActionProposal | null;
};
