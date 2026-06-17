"use client";

import type { ScheduleItem } from "@/lib/types/trip";
import { createEmptySchedule } from "@/lib/types/trip";
import {
  combineDatetime,
  formatDatetimeDisplay,
  isStructuredDatetime,
  parseDatetime,
} from "@/lib/utils/datetime";
import { card, inputField } from "@/lib/ui/classes";

type ScheduleFormListProps = {
  schedules: ScheduleItem[];
  onChange: (schedules: ScheduleItem[]) => void;
};

export function ScheduleFormList({ schedules, onChange }: ScheduleFormListProps) {
  function updateSchedule(index: number, field: keyof ScheduleItem, value: string) {
    const next = schedules.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    onChange(next);
  }

  function updateDatetime(index: number, date: string, time: string) {
    updateSchedule(index, "datetime", combineDatetime(date, time));
  }

  function addSchedule() {
    onChange([...schedules, createEmptySchedule()]);
  }

  function removeSchedule(index: number) {
    if (schedules.length <= 1) return;
    onChange(schedules.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-700">行程リスト</h2>
        <button
          type="button"
          onClick={addSchedule}
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-dark transition-colors hover:bg-primary-strong hover:text-white"
        >
          ＋ 追加
        </button>
      </div>

      {schedules.map((schedule, index) => {
        const { date, time } = parseDatetime(schedule.datetime);
        const hasLegacyDatetime =
          schedule.datetime !== "" && !isStructuredDatetime(schedule.datetime);

        return (
          <div key={index} className={`${card} space-y-4`}>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
                行程 {index + 1}
              </span>
              {schedules.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  className="text-xs text-stone-400 transition-colors hover:text-red-500"
                >
                  削除
                </button>
              ) : null}
            </div>

            <div>
              <span className="mb-2 block text-xs font-medium text-stone-500">
                日時
              </span>
              <div className="flex flex-col gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] text-stone-400">日付</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => updateDatetime(index, e.target.value, time)}
                    className={inputField}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] text-stone-400">時間</span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateDatetime(index, date, e.target.value)}
                    className={inputField}
                  />
                </label>
              </div>
              {date || time ? (
                <p className="mt-2 text-xs font-medium text-primary-strong">
                  {formatDatetimeDisplay(schedule.datetime)}
                </p>
              ) : null}
              {hasLegacyDatetime ? (
                <p className="mt-2 rounded-lg bg-primary-subtle px-2.5 py-2 text-xs text-stone-500">
                  以前の入力: {schedule.datetime}
                  <span className="mt-0.5 block text-[11px] text-stone-400">
                    日付・時間を選ぶと上書きされます
                  </span>
                </p>
              ) : null}
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">
                どこで
              </span>
              <input
                type="text"
                value={schedule.location}
                onChange={(e) => updateSchedule(index, "location", e.target.value)}
                placeholder="例: 東京駅"
                className={inputField}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">
                Google Map URL（任意）
              </span>
              <input
                type="url"
                value={schedule.map_url}
                onChange={(e) => updateSchedule(index, "map_url", e.target.value)}
                placeholder="https://maps.google.com/..."
                className={inputField}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">
                何をするか
              </span>
              <textarea
                value={schedule.activity}
                onChange={(e) => updateSchedule(index, "activity", e.target.value)}
                placeholder={"例: 新幹線で京都へ\nURLを入れると、表示時にタップで開けます"}
                rows={3}
                className={`${inputField} resize-none`}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}
