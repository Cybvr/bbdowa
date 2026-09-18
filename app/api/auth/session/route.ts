import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  REMEMBERED_SESSION_MS,
  SESSION_COOKIE_NAME,
  SHORT_SESSION_MS,
  sessionUserFromToken,
  verifySessionCookie,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function trimmedString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const valueToStore = value.trim();
  return valueToStore ? valueToStore.slice(0, maxLength) : null;
}

async function upsertUserProfile(
  decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>,
  profileInput: unknown,
  intent: "member" | "creator",
) {
  const userRef = adminDb.collection("users").doc(decodedToken.uid);
  const existingUser = await userRef.get();
  const profile = profileInput && typeof profileInput === "object"
    ? profileInput as Record<string, unknown>
    : {};
  const userData: Record<string, unknown> = {
    uid: decodedToken.uid,
    name: trimmedString(profile.name, 120) ?? trimmedString(decodedToken.name, 120),
    email: decodedToken.email ?? null,
    picture: decodedToken.picture ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if ("craft" in profile) userData.craft = trimmedString(profile.craft, 120);
  if ("portfolio" in profile) userData.portfolio = trimmedString(profile.portfolio, 500);
  if (!existingUser.exists || !existingUser.data()?.role) {
    userData.role = "pending";
  }
  if (!existingUser.exists) {
    userData.createdAt = FieldValue.serverTimestamp();
  }

  await userRef.set(userData, { merge: true });

  return {
    isNewUser: !existingUser.exists,
    role: typeof userData.role === "string"
      ? userData.role
      : typeof existingUser.data()?.role === "string"
        ? existingUser.data()?.role
        : null,
    creatorIntent: intent === "creator",
  };
}

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const token = await verifySessionCookie(sessionCookie);
    return NextResponse.json({ user: sessionUserFromToken(token) });
  } catch {
    const response = NextResponse.json({ user: null }, { status: 401 });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: { idToken?: unknown; rememberMe?: unknown; profile?: unknown; intent?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.idToken !== "string" || !body.idToken) {
    return NextResponse.json({ error: "A Firebase ID token is required." }, { status: 400 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(body.idToken);
    const signedInAt = decodedToken.auth_time * 1000;

    if (Date.now() - signedInAt > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Please sign in again to start a session." }, { status: 401 });
    }

    const intent = body.intent === "creator" ? "creator" : "member";
    const profileState = await upsertUserProfile(decodedToken, body.profile, intent);

    const expiresIn = body.rememberMe === true ? REMEMBERED_SESSION_MS : SHORT_SESSION_MS;
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, { expiresIn });
    const response = NextResponse.json({
      user: sessionUserFromToken(decodedToken),
      needsOnboarding: profileState.creatorIntent && profileState.role === "pending",
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Firebase could not verify this sign-in." }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
