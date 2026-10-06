import { NextResponse } from "next/server";

// Njeri for the client portal. Answers questions about the client's own jobs,
// invoices and company, and helps them write a job brief. Server-only so the
// OpenAI key never reaches the browser.

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_TURNS = 16;

type Turn = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are Njeri, the assistant in BBDO West Africa's client portal.
You talk to people at client companies. Use plain words and short sentences. Be warm and direct.

You can:
1. Answer questions about their own account using ONLY the account data below: their jobs, invoices and company. If the answer isn't in the data, say you don't have it and suggest they message their BBDO West Africa contact. Never invent numbers, dates or names.
2. Help them post a job. Ask short questions, one or two at a time, until you know: what they need (title), the goal and details (description), category, remote/hybrid/on-site, start and end dates or rough length, budget, and a few tags (skills or platforms). Fill sensible defaults when they don't care.

Reply with JSON only, in this shape:
{"answer": "your message to them, markdown allowed", "jobDraft": null}
When you have enough to post the job, set "jobDraft" to:
{"title": "", "summary": "markdown description: goal, what's needed, deliverables", "category": "", "workSetup": "remote|hybrid|onsite", "estimatedLength": "", "startDate": "YYYY-MM-DD or empty", "endDate": "YYYY-MM-DD or empty", "budget": "", "tags": [""]}
and in "answer" tell them to check the draft and press Post job. Only send a jobDraft when they've asked to post a job.`;

function isTurn(value: unknown): value is Turn {
  const turn = value as Turn;
  return Boolean(turn) && (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string";
}

function text(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanDraft(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const draft = value as Record<string, unknown>;
  const title = text(draft.title, 140);
  if (!title) return null;
  const date = (input: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(text(input)) ? text(input) : "");
  const setup = text(draft.workSetup);
  return {
    title,
    summary: text(draft.summary, 6000),
    category: text(draft.category, 80),
    workSetup: ["remote", "hybrid", "onsite"].includes(setup) ? setup : "remote",
    estimatedLength: text(draft.estimatedLength, 80),
    startDate: date(draft.startDate),
    endDate: date(draft.endDate),
    budget: text(draft.budget, 80),
    tags: Array.isArray(draft.tags) ? draft.tags.map((tag) => text(tag, 40)).filter(Boolean).slice(0, 12) : [],
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Njeri isn't configured yet." }, { status: 503 });

  let body: { messages?: unknown; account?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = (Array.isArray(body.messages) ? body.messages : []).filter(isTurn).slice(-MAX_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 6000) }));
  if (!messages.length) return NextResponse.json({ error: "No message provided." }, { status: 400 });

  // The browser sends the client's own account summary; keep it small.
  const account = JSON.stringify(body.account ?? {}).slice(0, 20000);
  const today = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "Africa/Lagos" }).format(new Date());

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nToday is ${today}.\n\nAccount data:\n${account}` },
          ...messages,
        ],
      }),
    });
    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { answer: raw };
    }
    return NextResponse.json({ answer: text(parsed.answer, 8000) || "Sorry, I didn't catch that. Could you say it another way?", jobDraft: cleanDraft(parsed.jobDraft) });
  } catch (cause) {
    console.error("Portal Njeri unavailable", cause);
    return NextResponse.json({ answer: "I can't answer right now. Please try again in a moment." });
  }
}
