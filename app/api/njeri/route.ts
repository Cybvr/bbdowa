import { NextResponse } from "next/server";
import { NJERI_SYSTEM_PROMPT } from "@/lib/njeri-assistant";
import type { ManagedCollection, NjeriActionProposal, NjeriRecordChange } from "@/lib/njeri-actions";

// Server-only: keeps OPENAI_API_KEY off the client. Njeri (components/njeri.tsx)
// posts the conversation here and falls back to the canned answers in
// lib/njeri-assistant.ts if this route errors or isn't configured.

export const runtime = "nodejs";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_RESEARCH_MODEL = "gpt-5-mini";
const MAX_TURNS = 12;
const MAX_TURN_LENGTH = 2000;

function liveContext(): string {
  const today = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date());

  return `Live context: today is ${today}. The user's timezone is Africa/Lagos.`;
}

type ChatTurn = { role: "user" | "assistant"; content: string };

function isChatTurn(value: unknown): value is ChatTurn {
  if (!value || typeof value !== "object") return false;
  const turn = value as Record<string, unknown>;
  return (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string";
}

function needsResearch(text: string): boolean {
  return /\b(research|look\s*up|find\s*out\s*about|investigate|add\s+(him|her|them|this\s+person)|add\s+(this\s+)?client|create\s+(a\s+)?client|add\s+(a\s+)?creator|create\s+(a\s+)?creator|create\s+(a\s+)?campaign|make\s+(a\s+)?campaign|draft\s+(a\s+)?campaign|update|edit|change|delete|remove)\b/i.test(text) && /\b(creator|client|campaign)\b/i.test(text);
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  const trimmed = value.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1));
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function nullableString(value: unknown): string | null {
  const result = stringValue(value);
  return result || null;
}

function recordSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function normalizeAction(value: unknown): NjeriActionProposal | null {
  if (!value || typeof value !== "object") return null;
  const action = value as Record<string, unknown>;
  const rawRecord = action.record;
  if (!rawRecord || typeof rawRecord !== "object") return null;
  const record = rawRecord as Record<string, unknown>;
  const sources = Array.isArray(action.sources)
    ? action.sources.filter((source): source is string => typeof source === "string").slice(0, 8)
    : [];

  if (action.type === "create_creator") {
    const name = stringValue(record.name);
    if (!name) return null;
    const rawHistory = Array.isArray(record.workHistory) ? record.workHistory : [];
    return {
      type: "create_creator",
      record: {
        name,
        category: stringValue(record.category, "Content"),
        title: stringValue(record.title),
        department: stringValue(record.department),
        location: stringValue(record.location),
        email: nullableString(record.email),
        phone: nullableString(record.phone),
        profileImage: nullableString(record.profileImage),
        portfolio: nullableString(record.portfolio),
        linkedin: nullableString(record.linkedin),
        instagram: nullableString(record.instagram),
        niche: nullableString(record.niche),
        followerCount: nullableString(record.followerCount),
        followerPlatform: nullableString(record.followerPlatform),
        yearsActive: typeof record.yearsActive === "number" && Number.isFinite(record.yearsActive) ? record.yearsActive : null,
        craftNote: stringValue(record.craftNote),
        workHistory: rawHistory
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
          .slice(0, 12)
          .map((item) => ({
            role: stringValue(item.role),
            company: stringValue(item.company),
            period: stringValue(item.period),
            location: stringValue(item.location) || undefined,
          }))
          .filter((item) => item.role || item.company),
      },
      sources,
    };
  }

  if (action.type === "create_client") {
    const name = stringValue(record.name);
    if (!name) return null;
    return {
      type: "create_client",
      record: {
        name,
        industry: stringValue(record.industry, "Other"),
        date: nullableString(record.date),
        profileImage: nullableString(record.profileImage),
        description: nullableString(record.description),
        targetAudience: nullableString(record.targetAudience),
      },
      sources,
    };
  }

  if (action.type === "create_campaign") {
    const name = stringValue(record.name);
    const clientName = stringValue(record.clientName);
    if (!name || !clientName) return null;
    const rawPlatform = Array.isArray(record.platform) ? record.platform : [];
    const status = record.status === "live" || record.status === "completed" ? record.status : "pitch";
    return {
      type: "create_campaign",
      record: {
        name,
        clientName,
        category: stringValue(record.category, "General"),
        status,
        year: typeof record.year === "number" && Number.isFinite(record.year) ? record.year : null,
        liveAt: nullableString(record.liveAt),
        summary: stringValue(record.summary),
        challenge: stringValue(record.challenge),
        insight: stringValue(record.insight),
        strategy: stringValue(record.strategy),
        platform: rawPlatform.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 12),
        execution: stringValue(record.execution),
        outcome: stringValue(record.outcome),
        target: stringValue(record.target),
      },
      sources,
    };
  }

  if (action.type === "update_record" || action.type === "delete_record") {
    const collectionValue = stringValue(action.collection);
    if (collectionValue !== "users" && collectionValue !== "clients" && collectionValue !== "campaigns") return null;
    const collection = collectionValue as ManagedCollection;
    const label = stringValue(action.label, stringValue(action.recordId));
    const recordId = recordSlug(stringValue(action.recordId, label));
    if (!recordId) return null;
    if (action.type === "delete_record") {
      return { type: "delete_record", collection, recordId, label, sources };
    }
    const rawChanges = action.changes;
    if (!rawChanges || typeof rawChanges !== "object") return null;
    const changes = Object.fromEntries(
      Object.entries(rawChanges as Record<string, unknown>)
        .filter(([key]) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(key))
        .map(([key, value]) => {
          const normalized: NjeriRecordChange = Array.isArray(value)
            ? value.filter((item): item is string => typeof item === "string").slice(0, 20)
            : typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null
              ? value
              : null;
          return [key, normalized];
        }),
    );
    return { type: "update_record", collection, recordId, label, changes, sources };
  }

  return null;
}

function researchInstructions(request: string, conversation: string): string {
  return `You are Njeri, an internal BBDO West Africa workspace assistant. Research the request using the web, prioritising official websites and reputable professional profiles. Do not invent facts, but treat details the user has pasted into the conversation (bios, handles, follower counts) as verified and use them in the record. For a campaign, use the user's stated intent as the source of truth and develop a useful first draft around it; never invent a client relationship or campaign result. Use null or an empty string when a field cannot be verified.

The latest user request is: ${request}
The recent conversation is: ${conversation}

Return JSON only with exactly this shape:
{
  "answer": "A short, useful summary of what you found. Say that any record below is a draft awaiting confirmation.",
  "action": null | {
    "type": "create_creator" | "create_client" | "create_campaign" | "update_record" | "delete_record",
    "record": { ... },
    "sources": ["https://..."]
  }
}

Use action=create_creator only when the user asks to add a person to creators. Its record must contain: name, category, title, department, location, email, phone, profileImage, portfolio, linkedin, instagram, niche, followerCount, followerPlatform, yearsActive, craftNote, workHistory. workHistory is an array of {role, company, period, location}.
Use action=create_client only when the user asks to add or create a client. Its record must contain: name, industry, date, profileImage, description, targetAudience.
Use action=create_campaign only when the user asks to create or draft a campaign and has provided a campaign name, client, and a sentence describing what the campaign is trying to do. Its record must contain: name, clientName, category, status, year, liveAt, summary, challenge, insight, strategy, platform, execution, outcome, target. Use the user's intent to develop the other fields. If the minimum context is missing, leave action null and ask only for the missing campaign name, client, or intent.
Use action=update_record when the user asks to update, edit, or change an existing creator, client, or campaign. Use collection users for creators, and use the record slug as recordId. Include only the fields that should change in changes.
Use action=delete_record when the user asks to delete or remove an existing creator, client, or campaign. Include the record slug as recordId and use the matching collection.
If the request is only research, leave action null. Never claim the record was saved; it is only a draft until the user confirms it in the interface.`;
}

// The REST Responses API has no output_text field (that's an SDK helper), so
// collect the text parts from the message items in output.
function responseText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const { output_text, output } = data as { output_text?: unknown; output?: unknown };
  if (typeof output_text === "string") return output_text;
  if (!Array.isArray(output)) return "";
  return output
    .filter((item): item is { type: string; content: unknown[] } => item?.type === "message" && Array.isArray(item.content))
    .flatMap((item) => item.content)
    .map((part) => (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string" ? (part as { text: string }).text : ""))
    .join("");
}

async function researchAndDraft(request: string, conversation: string): Promise<{ answer: string; action?: NjeriActionProposal | null }> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_RESEARCH_MODEL || DEFAULT_RESEARCH_MODEL,
      tools: [{ type: "web_search" }],
      input: researchInstructions(request, conversation),
    }),
  });

  if (!response.ok) {
    console.error("OpenAI research request failed", response.status, await response.text());
    throw new Error("Research request failed");
  }

  const data = await response.json();
  const parsed = parseJsonObject(responseText(data));
  if (!parsed || typeof parsed.answer !== "string") {
    throw new Error("Research response was not valid JSON");
  }

  const action = normalizeAction(parsed.action);
  return { answer: parsed.answer, action };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Njeri isn't configured yet." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawMessages = Array.isArray((body as { messages?: unknown })?.messages)
    ? (body as { messages: unknown[] }).messages
    : [];

  const messages = rawMessages
    .filter(isChatTurn)
    .slice(-MAX_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_TURN_LENGTH) }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  const latestMessage = messages[messages.length - 1].content;
  const previousUserMessage = messages.slice(0, -1).reverse().find((message) => message.role === "user")?.content ?? "";
  const continuesDraft = needsResearch(previousUserMessage) && /\b(add|include|also|use|save|create)\b/i.test(latestMessage);
  if (needsResearch(latestMessage) || continuesDraft) {
    try {
      return NextResponse.json(await researchAndDraft(latestMessage, messages.map((message) => `${message.role}: ${message.content}`).join("\n")));
    } catch (cause) {
      console.error("Njeri research unavailable", cause);
      return NextResponse.json({
        answer: "I couldn't complete the research right now. Please try again in a moment.",
      });
    }
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        temperature: 0.4,
        max_tokens: 400,
        messages: [{ role: "system", content: `${NJERI_SYSTEM_PROMPT}\n\n${liveContext()}` }, ...messages],
      }),
    });

    if (!response.ok) {
      console.error("OpenAI request failed", response.status, await response.text());
      return NextResponse.json({ error: "Njeri is unavailable right now." }, { status: 502 });
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ error: "Njeri didn't have an answer." }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch (cause) {
    console.error("Unable to reach OpenAI", cause);
    return NextResponse.json({ error: "Njeri is unavailable right now." }, { status: 502 });
  }
}
