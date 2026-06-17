"use server";

import { saveTrip } from "@/lib/db/trips";
import type { TripDraft } from "@/lib/types/trip";

export async function saveTripAction(draft: TripDraft) {
  return saveTrip(draft);
}
