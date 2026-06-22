"use client";

import { useState, useMemo } from "react";
import type { TripDraft } from "@/lib/types/trip";
import { TripTimeline } from "@/components/trips/TripTimeline";
import { TripMap } from "@/components/trips/TripMap";
import { TextWithLinks } from "@/components/ui/TextWithLinks";
import { parseDatetime } from "@/lib/utils/datetime";

type TripPreviewProps = {
  draft: TripDraft;
  screenshotMode?: boolean;
};

export function TripPreview({ draft, screenshotMode = false }: TripPreviewProps) {
  const [durations, setDurations] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("all");

  const uniqueDates = useMemo(() => {
    const dates = draft.schedules
      .map((s) => parseDatetime(s.datetime || "").date)
      .filter(Boolean) as string[];
    return Array.from(new Set(dates));
  }, [draft.schedules]);

  const displayedSchedules = useMemo(() => {
    if (selectedDate === "all") return draft.schedules;
    return draft.schedules.filter(
      (s) => parseDatetime(s.datetime || "").date === selectedDate
    );
  }, [draft.schedules, selectedDate]);

  const handleTabChange = (date: string) => {
    setSelectedDate(date);
    setDurations([]); 
  };

  const formatTabDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${dateObj.getMonth() + 1}/${dateObj.getDate()}(${days[dateObj.getDay()]})`;
  };

  // ▼ 追加：「2日以上ある」かつ「すべてタブ」の時はルートを非表示にするという判定
  const showRoute = !(uniqueDates.length > 1 && selectedDate === "all");

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

      {uniqueDates.length > 1 && (
        <div 
          className="mb-6 flex gap-2 overflow-x-auto pb-2" 
          style={{ scrollbarWidth: "none" }}
        >
          <button
            onClick={() => handleTabChange("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              selectedDate === "all"
                ? "bg-primary text-white shadow-sm"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            すべて
          </button>
          {uniqueDates.map((date) => (
            <button
              key={date}
              onClick={() => handleTabChange(date)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                selectedDate === date
                  ? "bg-primary text-white shadow-sm"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {formatTabDate(date)}
            </button>
          ))}
        </div>
      )}

      <div className="mb-8">
        {/* ▼ 修正：ルートを表示していいかの判定（showRoute）を渡す */}
        <TripMap schedules={displayedSchedules} onDurationsCalculated={setDurations} showRoute={showRoute} />
      </div>

      {/* ▼ 修正：タイムラインにも判定を渡す */}
      <TripTimeline schedules={displayedSchedules} screenshotMode={screenshotMode} durations={durations} showRoute={showRoute} />
    </article>
  );
}