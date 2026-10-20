import { NextResponse } from "next/server";
import { firestoreAs, verifyIdToken } from "@/lib/server/email";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const idToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const account = idToken ? await verifyIdToken(idToken) : null;
  if (!account) return NextResponse.json({ error: "Sign in to compose email." }, { status: 401 });

  try {
    const db = firestoreAs(idToken);
    const profile = await db.get(`users/${account.uid}`) ?? (await db.where("users", [["uid", account.uid]]))[0];
    if (profile?.role !== "admin" && profile?.role !== "manager") {
      return NextResponse.json({ error: "Only admins and managers can compose email." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Couldn’t verify email access. Try again." }, { status: 503 });
  }

  const from = process.env.EMAIL_FROM?.trim();
  if (!from) return NextResponse.json({ error: "The sender address is not configured." }, { status: 503 });
  return NextResponse.json({ from }, { headers: { "Cache-Control": "no-store" } });
}
