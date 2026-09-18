import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "__session";
export const SHORT_SESSION_MS = 12 * 60 * 60 * 1000;
export const REMEMBERED_SESSION_MS = 14 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  uid: string;
  name: string | null;
  email: string | null;
  picture: string | null;
};

export async function verifySessionCookie(sessionCookie: string): Promise<DecodedIdToken> {
  return adminAuth.verifySessionCookie(sessionCookie, true);
}

export function sessionUserFromToken(token: DecodedIdToken): SessionUser {
  return {
    uid: token.uid,
    name: typeof token.name === "string" ? token.name : null,
    email: typeof token.email === "string" ? token.email : null,
    picture: typeof token.picture === "string" ? token.picture : null,
  };
}
