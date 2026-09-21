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
    };

export type NjeriResponse = {
  answer: string;
  action?: NjeriActionProposal | null;
};
