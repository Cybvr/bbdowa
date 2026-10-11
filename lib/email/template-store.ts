import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { TEMPLATE_COLLECTION, TEMPLATE_DEFAULTS, validTemplate, type SavedTemplate } from "./template-definitions";
import { buildMessageHtml, extractMessageCta } from "../message-html";

export async function loadTemplates(): Promise<SavedTemplate[]> {
  const snapshot = await getDocs(collection(firebaseDb, TEMPLATE_COLLECTION));
  return TEMPLATE_DEFAULTS.map((base) => {
    const saved = snapshot.docs.find((item) => item.id === base.key)?.data();
    if (!validTemplate(saved, base)) return base;
    const merged = { ...base, ...saved, variables: base.variables };
    return merged.kind === "message" ? { ...merged, message: buildMessageHtml(merged.message, merged.actionLabel, merged.actionHref) } : merged;
  });
}

export async function saveTemplate(template: SavedTemplate) {
  const base = TEMPLATE_DEFAULTS.find((item) => item.key === template.key);
  const embedded = template.kind === "message" ? extractMessageCta(template.message) : null;
  const normalized = template.kind === "message" ? { ...template, actionLabel: embedded?.label ?? "", actionHref: embedded?.href ?? "" } : template;
  if (!base || !validTemplate(normalized, base)) throw new Error("Check the subject, message and variables before saving.");
  const saved = { ...normalized, variables: base.variables, updatedAt: new Date().toISOString() };
  await setDoc(doc(firebaseDb, TEMPLATE_COLLECTION, template.key), saved);
  return saved;
}
