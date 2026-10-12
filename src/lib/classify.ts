import { CATEGORIES, type Priority } from "./constants";
import { categoryIdsForDepartment } from "./rbac";

type KeywordRule = {
  category: (typeof CATEGORIES)[number]["id"];
  keywords: string[];
};

const RULES: KeywordRule[] = [
  { category: "ELECTRICAL", keywords: ["fan", "light", "lights", "bulb", "lamp", "power", "electric", "electrical", "mcb", "socket", "switch", "wiring", "outage", "fuse", "tube", "floodlight", "street light"] },
  { category: "PLUMBING", keywords: ["leak", "leaking", "pipe", "tap", "drain", "toilet", "geyser", "washroom", "plumbing", "flush", "drip", "sewage"] },
  { category: "WATER", keywords: ["water", "cooler", "drinking water", "chlorine", "tank", "borewell"] },
  { category: "IT_WIFI", keywords: ["wifi", "wi-fi", "internet", "network", "ssid", "lan", "router", "access point", "email", "computer", "it support"] },
  { category: "HOUSEKEEPING", keywords: ["clean", "cleaned", "cleaning", "garbage", "dust", "housekeeping", "trash", "debris", "dirty"] },
  { category: "ACADEMIC", keywords: ["projector", "classroom", "lecture", "lab", "seminar", "hdmi", "smartboard", "equipment"] },
  { category: "HOSTEL", keywords: ["hostel", "dorm", "room mate", "warden"] },
  { category: "MESS", keywords: ["mess", "cafeteria", "food", "canteen", "dining"] },
  { category: "FURNITURE", keywords: ["desk", "chair", "bench", "furniture", "table", "cupboard"] },
  { category: "CIVIL", keywords: ["paving", "crack", "ceiling", "wall", "floor", "civil", "tile", "plaster", "ac", "air condition"] },
  { category: "TRANSPORT", keywords: ["bus", "transport", "pickup", "route"] },
  { category: "SECURITY", keywords: ["security", "gate", "latch", "turnstile", "lock", "theft"] },
  { category: "MEDICAL", keywords: ["medical", "clinic", "nurse", "first aid"] },
  { category: "SPORTS", keywords: ["sports", "court", "gym", "floodlight", "playground"] },
];

export const CLASSIFY_EXAMPLES = [
  { label: "Electrical", text: "The fan in Room 204 is not working" },
  { label: "Plumbing", text: "Water is leaking from the washroom pipe" },
  { label: "IT Support", text: "The campus Wi-Fi is not connecting" },
  { label: "Housekeeping", text: "The classroom has not been cleaned" },
  { label: "Equipment", text: "The projector in the lecture hall is broken" },
] as const;

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

export function classifyComplaint(text: string) {
  const haystack = normalize(text);
  const scores = RULES.map((rule) => {
    const hits = rule.keywords.filter((keyword) => haystack.includes(keyword));
    return { category: rule.category, score: hits.length, hits };
  }).sort((a, b) => b.score - a.score);

  const best = scores[0]?.score ? scores[0] : { category: "OTHER" as const, score: 0, hits: [] as string[] };
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  const confidence = total ? Math.round((best.score / total) * 100) : 0;
  const meta = CATEGORIES.find((item) => item.id === best.category);

  return {
    category: best.category,
    label: meta?.label ?? best.category,
    unit: meta?.unit ?? "Estate Office",
    confidence,
    matched: best.hits,
  };
}

export function suggestPriority(text: string): Priority {
  const haystack = normalize(text);
  if (/(emergency|critical|fire|injured|no power|not connecting|dark|flood)/.test(haystack)) return "HIGH";
  if (/(broken|not working|leaking|outage|down)/.test(haystack)) return "MEDIUM";
  return "MEDIUM";
}

export function staffMatchesCategory(department: string | null, category: string) {
  const categories = categoryIdsForDepartment(department);
  return categories.includes(category);
}

export function allocationExplanation(input: {
  categoryLabel: string;
  unit: string;
  workerName?: string | null;
  pending?: number;
}) {
  if (!input.workerName) {
    return `No available ${input.unit} staff was found for ${input.categoryLabel}. An administrator can assign this ticket manually.`;
  }
  return `${input.categoryLabel} work is routed to ${input.unit}. ${input.workerName} is suggested because they have the matching skill and the fewest open tasks (${input.pending ?? 0}).`;
}
