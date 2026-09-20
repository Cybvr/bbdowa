import { NextResponse } from "next/server";
import { NJERI_SYSTEM_PROMPT } from "@/lib/njeri-assistant";

// Server-only: keeps OPENAI_API_KEY off the client. Njeri (components/njeri.tsx)
// posts the conversation here and falls back to the canned answers in
// lib/njeri-assistant.ts if this route errors or isn't configured.

export const runtime = "nodejs";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TURNS = 12;
const MAX_TURN_LENGTH = 2000;

type ChatTurn = { role: "user" | "assistant"; content: string };

function isChatTurn(value: unknown): value is ChatTurn {
  if (!value || typeof value !== "object") return false;
  const turn = value as Record<string, unknown>;
  return (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string";
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
        messages: [{ role: "system", content: NJERI_SYSTEM_PROMPT }, ...messages],
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
