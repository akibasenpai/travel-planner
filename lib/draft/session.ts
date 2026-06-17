import type { TripDraft } from "@/lib/types/trip";

export const DRAFT_STORAGE_KEY = "tabimemo-draft";

export function saveDraftToSession(draft: TripDraft): void {
  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function loadDraftFromSession(): TripDraft | null {
  const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TripDraft;
  } catch {
    return null;
  }
}

export function clearDraftFromSession(): void {
  sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}
