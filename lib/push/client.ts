"use client";

import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";

export const PUSH_SUBSCRIPTIONS_COLLECTION = "pushSubscriptions";

export type PushSupport = "unsupported" | "unconfigured" | "blocked" | "disabled" | "enabled";

export function pushPublicKey(): string {
  return process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim() ?? "";
}

export function browserPushSupport(): PushSupport {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  if (!pushPublicKey()) return "unconfigured";
  if (Notification.permission === "denied") return "blocked";
  return "disabled";
}

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(base64);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function subscriptionId(uid: string, endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${uid}_${hash}`;
}

async function saveSubscription(uid: string, subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.auth || !json.keys?.p256dh) throw new Error("The browser returned an incomplete push subscription.");
  const id = await subscriptionId(uid, json.endpoint);
  await setDoc(
    doc(firebaseDb, PUSH_SUBSCRIPTIONS_COLLECTION, id),
    {
      uid,
      endpoint: json.endpoint,
      expirationTime: json.expirationTime ?? null,
      keys: { auth: json.keys.auth, p256dh: json.keys.p256dh },
      userAgent: navigator.userAgent.slice(0, 500),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function currentPushState(uid: string): Promise<PushSupport> {
  const support = browserPushSupport();
  if (support !== "disabled") return support;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return "disabled";
  await saveSubscription(uid, subscription);
  return "enabled";
}

export async function enablePush(uid: string): Promise<PushSupport> {
  const support = browserPushSupport();
  if (support === "unsupported" || support === "unconfigured" || support === "blocked") return support;

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "disabled";

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey(pushPublicKey()),
  });
  await saveSubscription(uid, subscription);
  return "enabled";
}

export async function disablePush(uid: string): Promise<PushSupport> {
  const support = browserPushSupport();
  if (support === "unsupported" || support === "unconfigured") return support;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const id = await subscriptionId(uid, subscription.endpoint);
    await subscription.unsubscribe();
    await deleteDoc(doc(firebaseDb, PUSH_SUBSCRIPTIONS_COLLECTION, id));
  }
  return Notification.permission === "denied" ? "blocked" : "disabled";
}
