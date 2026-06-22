"use client"; // 👈 追加：ボタンを押した時の処理（状態）を持つために必要

import Link from "next/link";
import type { Trip } from "@/lib/types/trip";
import { formatDatetimeDisplay } from "@/lib/utils/datetime";
import { deleteTripAction } from "@/app/actions/trips"; // 👈 追加：裏側の削除命令を呼び出す

type TripCardProps = {
  trip: Trip;
};

export function TripCard({ trip }: TripCardProps) {
  const scheduleCount = trip.schedules.length;
  const firstSchedule = trip.schedules[0];

  // ▼ 追加：削除ボタンが押された時の処理
  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault(); // リンクへの移動をブロックする
    e.stopPropagation(); // 他のクリックイベントを防ぐ

    // 誤って消さないように確認メッセージを出す
    if (window.confirm(`「${trip.title || "無題のしおり"}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
      try {
        await deleteTripAction(trip.id);
      } catch (error) {
        alert("削除に失敗しました。時間をおいて再度お試しください。");
      }
    }
  }

  return (
    // ▼ 修正：Linkを内側に閉じ込め、外側をdivにすることで、ボタンとリンクが干渉しないようにする
    <div className="group relative block overflow-hidden rounded-2xl border border-primary/30 bg-white shadow-sm transition-all hover:border-primary hover:shadow-md">
      <Link href={`/trip/${trip.id}`} className="block h-full w-full">
        <div className="h-1.5 bg-primary" />
        <div className="p-4 pb-12"> {/* 👈 修正：ボタンが被らないように下の余白(pb-12)を増やす */}
          <h2 className="text-base font-bold text-stone-800">
            {trip.title || "無題のしおり"}
          </h2>
          {trip.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-stone-500">
              {trip.description}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="rounded-full bg-primary-light px-2 py-0.5 font-medium text-primary-dark">
              {scheduleCount} 件の行程
            </span>
            {firstSchedule?.datetime ? (
              <span>{formatDatetimeDisplay(firstSchedule.datetime)}</span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* ▼ 追加：右下に浮かぶ削除ボタン */}
      {/* ▼ 修正：スマホでは常に表示（opacity-100）、PC（md以上）ではホバー時のみ表示 */}
      <button
        onClick={handleDelete}
        className="absolute bottom-3 right-3 z-10 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-500 transition-all hover:bg-red-100 opacity-100 md:opacity-0 md:group-hover:opacity-100"
      >
        🗑️ 削除
      </button>
    </div>
  );
}