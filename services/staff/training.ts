import { api } from "@/lib/api";

export type TrainingContentType = "video" | "text" | "quiz" | "image";

export interface QuizContent {
  question: string;
  options: string[];
  correct: number;
  pass_threshold?: number;
}

export interface TrainingSection {
  id: string;
  chapter_id: string;
  title: string;
  title_i18n: Record<string, string> | null;
  content_type: TrainingContentType;
  content_text: string | null;
  content_text_i18n: Record<string, string> | null;
  video_url: string | null;
  position: number;
}

export interface TrainingChapter {
  id: string;
  course_id: string;
  title: string;
  title_i18n: Record<string, string> | null;
  position: number;
  sections: TrainingSection[];
}

export interface TrainingPlayerData {
  id: string;
  business_id: string;
  offer_id: string;
  title: string;
  title_i18n: Record<string, string> | null;
  description: string | null;
  description_i18n: Record<string, string> | null;
  chapters: TrainingChapter[];
  completed_sections: string[];
}

export interface StaffTrainingItem {
  offer_id: string;
  offer_title: string;
  sessions_total: number | null;
  redemption_id: string | null;
  status: "not_started" | "active" | "completed" | string;
  sessions_used: number;
  course: {
    id: string;
    offer_id: string;
    title: string;
    description: string | null;
  } | null;
}

export interface TrainingRegisterResult {
  redemption_id: string;
  status: string;
  booked_slot_count: number;
  already_registered: boolean;
}

export async function fetchStaffTraining(
  businessId: string,
): Promise<StaffTrainingItem[]> {
  const data = await api.get<{ items: StaffTrainingItem[] }>(
    `/training?action=staff-training&business_id=${encodeURIComponent(businessId)}`,
  );
  return data.items ?? [];
}

export async function registerForTraining(
  offerId: string,
): Promise<TrainingRegisterResult> {
  return api.post<TrainingRegisterResult>("/training?action=register", {
    offer_id: offerId,
    slot_ids: [],
  });
}

export async function fetchPlayerData(
  redemptionId: string,
): Promise<TrainingPlayerData> {
  const params = new URLSearchParams({
    action: "player",
    redemption_id: redemptionId,
  });
  const data = await api.get<{ course: TrainingPlayerData }>(
    `/training?${params.toString()}`,
  );
  return data.course;
}

export async function markSectionComplete(
  redemptionId: string,
  sectionId: string,
): Promise<{ completed: boolean; course_finished: boolean }> {
  return api.post<{ completed: boolean; course_finished: boolean }>(
    "/training?action=progress",
    { redemption_id: redemptionId, section_id: sectionId },
  );
}

/** Localized title/text helper (parity with web `ti`). */
export function trainingLocalized(
  map: Record<string, string> | null | undefined,
  fallback: string,
  locale: string,
): string {
  if (!map) return fallback;
  const code = locale.split("-")[0];
  return map[locale] ?? map[code] ?? map.en ?? fallback;
}

/** Flatten TipTap JSON or return plain text. */
export function trainingPlainText(raw: string): string {
  if (!raw.trim()) return "";
  try {
    const parsed = JSON.parse(raw) as { type?: string; content?: unknown[] };
    if (parsed?.type === "doc" && Array.isArray(parsed.content)) {
      return extractTipTapText(parsed.content).trim();
    }
  } catch {
    // plain string
  }
  return raw.replace(/<[^>]+>/g, "").trim();
}

function extractTipTapText(nodes: unknown[]): string {
  const parts: string[] = [];
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (typeof n.text === "string") parts.push(n.text);
    if (Array.isArray(n.content)) parts.push(extractTipTapText(n.content));
    if (n.type === "paragraph" || n.type === "heading") parts.push("\n");
  }
  return parts.join("");
}
