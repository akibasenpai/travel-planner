"use client";

import { useState } from "react"; // 👈 追加：状態管理を使うため
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
  // ▼ 追加：解析中のローディング状態やメッセージを管理する変数
  const [isParsing, setIsParsing] = useState<Record<number, boolean>>({});
  const [parseMessage, setParseMessage] = useState<Record<number, string>>({});

  function updateSchedule(index: number, field: keyof ScheduleItem, value: any) {
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

  function moveSchedule(index: number, direction: 'up' | 'down') {
    const newSchedules = [...schedules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSchedules[index];
    newSchedules[index] = newSchedules[targetIndex];
    newSchedules[targetIndex] = temp;
    onChange(newSchedules);
  }

  // ▼ 追加：APIを呼び出してURLを解析するメイン処理
  async function handleParseUrl(index: number, url: string) {
    if (!url) return;
    
    // 解析開始！
    setIsParsing((prev) => ({ ...prev, [index]: true }));
    setParseMessage((prev) => ({ ...prev, [index]: "" }));

    try {
      const res = await fetch("/api/parse-map-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (res.ok && data.lat && data.lng) {
        // 成功したら、座標を保存して、URLを長いものに書き換える
        const next = [...schedules];
        next[index] = { 
          ...next[index], 
          lat: data.lat, 
          lng: data.lng, 
          map_url: data.finalUrl || url 
        };
        onChange(next);
        setParseMessage((prev) => ({ ...prev, [index]: "✅ 座標を取得しました！" }));
      } else {
        setParseMessage((prev) => ({ ...prev, [index]: "❌ " + (data.error || "取得に失敗しました") }));
      }
    } catch (e) {
      setParseMessage((prev) => ({ ...prev, [index]: "❌ 通信エラーが発生しました" }));
    } finally {
      setIsParsing((prev) => ({ ...prev, [index]: false }));
    }
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
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
                  行程 {index + 1}
                </span>
                {index > 0 && (
                  <button type="button" onClick={() => moveSchedule(index, 'up')} className="text-xs text-stone-400 hover:text-primary-dark">↑</button>
                )}
                {index < schedules.length - 1 && (
                  <button type="button" onClick={() => moveSchedule(index, 'down')} className="text-xs text-stone-400 hover:text-primary-dark">↓</button>
                )}
              </div>
              
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

            {/* ▼ 修正：URL入力欄の横に解析ボタンを追加！ */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">
                Google Map URL（任意）
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={schedule.map_url}
                  onChange={(e) => updateSchedule(index, "map_url", e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className={`${inputField} flex-1`}
                />
                <button
                  type="button"
                  disabled={!schedule.map_url || isParsing[index]}
                  onClick={() => handleParseUrl(index, schedule.map_url)}
                  className="shrink-0 rounded-lg bg-stone-100 px-3 py-2 text-xs font-bold text-stone-600 transition-colors hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isParsing[index] ? "解析中..." : "解析する"}
                </button>
              </div>
              
              {/* 解析結果のメッセージを表示 */}
              {parseMessage[index] && (
                <p className="mt-1 text-[11px] text-stone-500">{parseMessage[index]}</p>
              )}
              {/* すでに座標が保存されている場合はチェックマークを表示 */}
              {schedule.lat && schedule.lng && !parseMessage[index] ? (
                <p className="mt-1 text-[11px] text-emerald-600">
                  ✅ 座標保存済み（{schedule.lat.toFixed(4)}, {schedule.lng.toFixed(4)}）
                </p>
              ) : null}
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