"use client"; // 👈 追加：データの受け渡し（状態管理）を行うため

import { useState } from "react";
import type { TripDraft } from "@/lib/types/trip";
import { TripTimeline } from "@/components/trips/TripTimeline";
import { TripMap } from "@/components/trips/TripMap";
import { TextWithLinks } from "@/components/ui/TextWithLinks";

type TripPreviewProps = {
  draft: TripDraft;
  screenshotMode?: boolean;
};

export function TripPreview({ draft, screenshotMode = false }: TripPreviewProps) {
  // ▼ 追加：地図から受け取った時間を一時的に保存する箱
  const [durations, setDurations] = useState<string[]>([]);

  return (
    <article
      className={
        screenshotMode
          ? "rounded-3xl bg-primary-subtle p-6 ring-1 ring-primary/30"
          : "rounded-2xl border border-primary/25 bg-white p-5 shadow-sm"
      }
    >
      <header className="mb-6 border-b border-primary/20 pb-4">
        <p className="text-xs font-semibold tracking-widest text-primary-strong">
          旅行のしおり
        </p>
        <h2 className="mt-1 text-2xl font-bold leading-tight text-stone-800">
          {draft.title || "（タイトル未入力）"}
        </h2>
        {draft.description ? (
          <TextWithLinks
            text={draft.description}
            className="mt-3 text-sm leading-relaxed text-stone-600"
          />
        ) : null}
      </header>

      <div className="mb-8">
        {/* ▼ 修正：時間を計算し終わったら、上の setDurations に渡してもらう */}
        <TripMap schedules={draft.schedules} onDurationsCalculated={setDurations} />
      </div>

      {/* ▼ 修正：保存された時間をタイムラインに引き渡す！ */}
      <TripTimeline schedules={draft.schedules} screenshotMode={screenshotMode} durations={durations} />
    </article>
  );
}