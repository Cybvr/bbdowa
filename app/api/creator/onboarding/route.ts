import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function value(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Sign in before completing creator onboarding." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid onboarding data." }, { status: 400 });
  }

  try {
    const sessionUser = await verifySessionCookie(sessionCookie);
    const userRef = adminDb.collection("users").doc(sessionUser.uid);
    const existingUser = await userRef.get();
    const existingData = existingUser.data() ?? {};

    if (existingData.role && existingData.role !== "pending") {
      return NextResponse.json({ error: "This account is not a pending creator account." }, { status: 403 });
    }

    const name = value(body.name, 120) || value(sessionUser.name, 120);
    const craft = value(body.craft, 120);
    if (!name || !craft) {
      return NextResponse.json({ error: "Your name and primary craft are required." }, { status: 400 });
    }

    await userRef.set({
      uid: sessionUser.uid,
      email: sessionUser.email ?? existingData.email ?? null,
      name,
      picture: sessionUser.picture ?? existingData.picture ?? null,
      type: "creator",
      role: "pending",
      craft,
      portfolio: value(body.portfolio, 500) || null,
      onboardingStatus: "submitted",
      creatorProfile: {
        name,
        craft,
        location: value(body.location, 120) || null,
        portfolio: value(body.portfolio, 500) || null,
        bio: value(body.bio, 800) || null,
        instagram: value(body.instagram, 160) || null,
        linkedin: value(body.linkedin, 160) || null,
      },
      onboardingCompletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Your session has expired. Sign in again to continue." }, { status: 401 });
  }
}
