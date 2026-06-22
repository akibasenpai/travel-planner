"use server";

import { saveTrip, deleteTrip } from "@/lib/db/trips"; // 👈 修正：deleteTrip を読み込む
import { revalidatePath } from "next/cache"; // 👈 追加：画面を自動で最新にする機能
import type { TripDraft } from "@/lib/types/trip";

export async function saveTripAction(draft: TripDraft) {
  const result = await saveTrip(draft);
  revalidatePath("/"); // 保存したら一覧を最新にする
  return result;
}

// ▼ 追加：削除ボタンが押された時に走る処理
export async function deleteTripAction(id: string) {
  await deleteTrip(id);
  revalidatePath("/"); // 削除したら一覧を最新にする
}