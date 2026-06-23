"use client";

import { useState } from "react"; // 👈 追加：ポップアップの表示状態を管理する
import Link from "next/link";
import type { Trip } from "@/lib/types/trip";
import { formatDatetimeDisplay } from "@/lib/utils/datetime";
import { deleteTripAction } from "@/app/actions/trips";

type TripCardProps = {
  trip: Trip;
};

export function TripCard({ trip }: TripCardProps) {
  const scheduleCount = trip.schedules.length;
  const firstSchedule = trip.schedules[0];

  // ▼ 追加：オリジナルポップアップの状態管理
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ゴミ箱ボタンを押した時（ポップアップを開く）
  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  }

  // 「削除しない」を押した時（ポップアップを閉じる）
  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(false);
  }

  // 「削除」を押した時（実際に削除を実行する）
  async function handleConfirmDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);

    try {
      await deleteTripAction(trip.id);
      // 成功時は一覧が自動更新されるので何もしなくてOK
    } catch (error) {
      alert("削除に失敗しました。時間をおいて再度お試しください。");
      setIsDeleting(false);
      setShowModal(false);
    }
  }

  return (
    <>
      <div className="group relative block overflow-hidden rounded-2xl border border-primary/30 bg-white shadow-sm transition-all hover:border-primary hover:shadow-md">
        <Link href={`/trip/${trip.id}`} className="block h-full w-full">
          <div className="h-1.5 bg-primary" />
          <div className="p-4 pb-12">
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

        {/* 削除ボタン */}
        <button
          onClick={handleDeleteClick}
          className="absolute bottom-3 right-3 z-10 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-500 transition-all hover:bg-red-100 opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
          🗑️ 削除
        </button>
      </div>

      {/* ▼ 追加：オリジナルの確認ポップアップ */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity"
          onClick={handleCancel} // 背景タップでもキャンセル扱いにする
        >
          {/* ポップアップ本体 */}
          <div 
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()} // ポップアップの中身をタップしても閉じないようにする
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-stone-800">しおりの削除</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                「<span className="font-bold">{trip.title || "無題のしおり"}</span>」を削除してもよろしいですか？<br />
                この操作は取り消せません。
              </p>
            </div>
            
            <div className="flex border-t border-stone-100 bg-stone-50">
              {/* ご希望の「削除しない」ボタン */}
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="flex-1 py-4 text-sm font-bold text-stone-500 hover:bg-stone-100 disabled:opacity-50"
              >
                削除しない
              </button>
              
              <div className="w-px bg-stone-100" /> {/* 真ん中の仕切り線 */}
              
              {/* ご希望の「削除」ボタン */}
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-4 text-sm font-bold text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                {isDeleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}