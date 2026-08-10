"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TripDraft } from "@/lib/types/trip";
import { createEmptyDraft, tripToDraft } from "@/lib/types/trip";
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
    const savedDraft = loadDraftFromSession();
    if (savedDraft) {
      setDraft(savedDraft);
      clearDraftFromSession();
    }
  }, []);
  
  function handlePreview() {
    saveDraftToSession(draft);
    router.push("/preview");
  }

  function handleAddSchedule() {
    const newSchedules = [...(draft.schedules || []), {}];
    setDraft({ ...draft, schedules: newSchedules as any });
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
          className={`${inputField} resize-y`}
        />
      </label>

      <ScheduleFormList onChange="{(schedules)" schedules="{draft.schedules}"> setDraft({ ...draft, schedules })}
      />

      <button
        type="button"
        onClick={handleAddSchedule}
        className="w-full rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 py-3 text-sm font-bold text-stone-500 transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary-strong"
      >
        ＋ 行程を追加する
      </button>

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
  return <TripEditForm initialDraft="{tripToDraft(trip)}"/>;
}