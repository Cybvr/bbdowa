import { NextResponse } from "next/server";
import { NJERI_SYSTEM_PROMPT } from "@/lib/njeri-assistant";
import type { NjeriActionProposal } from "@/lib/njeri-actions";

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
  return /\b(research|look\s*up|find\s*out\s*about|investigate|add\s+(him|her|them|this\s+person)|add\s+(this\s+)?client|create\s+(a\s+)?client|add\s+(a\s+)?creator|create\s+(a\s+)?creator)\b/i.test(text);
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

  return null;
}

function researchInstructions(request: string): string {
  return `You are Njeri, an internal BBDO West Africa workspace assistant. Research the person or client in the user's request using the web, prioritising official websites and reputable professional profiles. Do not invent facts. Use null or an empty string when a field cannot be verified.

The user request is: ${request}

Return JSON only with exactly this shape:
{
  "answer": "A short, useful summary of what you found. Say that any record below is a draft awaiting confirmation.",
  "action": null | {
    "type": "create_creator" | "create_client",
    "record": { ... },
    "sources": ["https://..."]
  }
}

Use action=create_creator only when the user asks to add a person to creators. Its record must contain: name, category, title, department, location, email, phone, profileImage, portfolio, linkedin, instagram, niche, followerCount, followerPlatform, yearsActive, craftNote, workHistory. workHistory is an array of {role, company, period, location}.
Use action=create_client only when the user asks to add or create a client. Its record must contain: name, industry, date, profileImage, description, targetAudience.
If the request is only research, leave action null. Never claim the record was saved; it is only a draft until the user confirms it in the interface.`;
}

async function researchAndDraft(request: string): Promise<{ answer: string; action?: NjeriActionProposal | null }> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_RESEARCH_MODEL || DEFAULT_RESEARCH_MODEL,
      tools: [{ type: "web_search" }],
      input: researchInstructions(request),
    }),
  });

  if (!response.ok) {
    console.error("OpenAI research request failed", response.status, await response.text());
    throw new Error("Research request failed");
  }

  const data = await response.json();
  const parsed = parseJsonObject(typeof data?.output_text === "string" ? data.output_text : "");
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
  if (needsResearch(latestMessage)) {
    try {
      return NextResponse.json(await researchAndDraft(latestMessage));
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
