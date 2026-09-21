const accessToken = process.env.FIREBASE_ACCESS_TOKEN;
const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID || "bbdowa";

if (!accessToken || !projectId) {
  throw new Error("Set FIREBASE_ACCESS_TOKEN and FIREBASE_PROJECT_ID before running this seed.");
}

const now = new Date().toISOString();
const creator = {
  slug: "amazing-klef",
  name: "Amazing Klef",
  role: "creator",
  roles: ["creator"],
  title: "Published Photographer & Multifaceted Creative",
  department: "",
  category: "Photography",
  tags: [],
  location: "",
  entity: "Freelancer",
  dayRate: "",
  rateMin: null,
  rateCurrency: "NGN",
  hideRate: true,
  terms: "",
  availability: "unconfirmed",
  clearance: "pending",
  vetted: false,
  vouchedBy: "",
  workedOn: [],
  yearsActive: null,
  portfolio: "https://www.theamazingklef.com",
  behance: null,
  email: "info@theamazingklef.com",
  phone: "+2348064819078",
  profileImage: null,
  addedAt: now,
  featuredImage: null,
  workHistory: [],
  linkedin: null,
  instagram: "https://www.instagram.com/amazingklef",
  contactNote: "WhatsApp",
  followerCount: "318K",
  followerPlatform: "Instagram",
  gender: null,
  age: null,
  niche: "Photography",
  lastEngaged: null,
  craftNote: "Published Photographer & Multifaceted Creative",
  createdAt: now,
  updatedAt: now,
};

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { integerValue: String(value) };
  if (typeof value === "object") {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, firestoreValue(nested)])) } };
  }
  return { stringValue: String(value) };
}

const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users`;
const documentUrl = `${baseUrl}/amazing-klef`;
const headers = {
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
};

const existingResponse = await fetch(documentUrl, { headers });
const exists = existingResponse.ok;
if (!exists && existingResponse.status !== 404) {
  throw new Error(`Unable to check existing creator: ${existingResponse.status} ${await existingResponse.text()}`);
}

const fields = Object.fromEntries(Object.entries(creator).map(([key, value]) => [key, firestoreValue(value)]));
const url = exists
  ? `${documentUrl}?${Object.keys(fields).map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join("&")}`
  : `${documentUrl}?currentDocument.exists=false`;

const response = await fetch(url, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ fields }),
});

if (!response.ok) {
  throw new Error(`Unable to seed Amazing Klef: ${response.status} ${await response.text()}`);
}

console.log(`${exists ? "Updated" : "Seeded"} creator Amazing Klef (${creator.slug}).`);
