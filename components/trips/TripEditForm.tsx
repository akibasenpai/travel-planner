"use client";

import { useState, useEffect } from "react"; // 👈 useEffect を追加
import { useRouter } from "next/navigation";
import type { TripDraft } from "@/lib/types/trip";
import { createEmptyDraft, tripToDraft } from "@/lib/types/trip";
// 👇 loadDraftFromSession と clearDraftFromSession を追加
import { saveDraftToSession, loadDraftFromSession, clearDraftFromSession } from "@/lib/draft/session";
import { ScheduleFormList } from "@/components/trips/ScheduleFormList";
import { btnPrimary, inputField } from "@/lib/ui/classes";

type TripEditFormProps = {
  initialDraft?: TripDraft;
};

export function TripEditForm({ initialDraft }: TripEditFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<TripDraft>(
    initialDraft ?? createEmptyDraft(),
  );

  useEffect(() => {
    // 画面を開いた時にセッション（一時保存）データがあるか確認
    const savedDraft = loadDraftFromSession();
    if (savedDraft) {
      setDraft(savedDraft); // 一時保存データで画面を上書きする
      clearDraftFromSession(); // 読み込んだら消去する（他の旅行データに混ざらないようにするため）
    }
  }, []);
  
  function handlePreview() {
    saveDraftToSession(draft);
    router.push("/preview");
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        handlePreview();
      }}
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-stone-600">
          旅行のタイトル
        </span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="例: 京都・大阪 2泊3日"
          className={`${inputField} py-3 text-base font-medium`}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-stone-600">
          旅行の説明文
        </span>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="旅の目的やメモなど"
          rows={4}
          className={`${inputField} resize-none`}
        />
      </label>

      <ScheduleFormList
        schedules={draft.schedules}
        onChange={(schedules) => setDraft({ ...draft, schedules })}
      />

      <button type="submit" className={btnPrimary}>
        プレビューして確認
      </button>
    </form>
  );
}

export function TripEditFormFromTrip({
  trip,
}: {
  trip: Parameters<typeof tripToDraft>[0];
}) {
  return <TripEditForm initialDraft={tripToDraft(trip)} />;
}
