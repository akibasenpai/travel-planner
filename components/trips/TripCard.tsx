"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 👈 追加
import type { Trip } from "@/lib/types/trip";
import { formatDatetimeDisplay } from "@/lib/utils/datetime";
import { deleteTripAction } from "@/app/actions/trips";
import { tripToDraft } from "@/lib/types/trip"; // 👈 追加
import { saveDraftToSession } from "@/lib/draft/session"; // 👈 追加

type TripCardProps = {
  trip: Trip;
};

export function TripCard({ trip }: TripCardProps) {
  const router = useRouter(); // 👈 追加
  const scheduleCount = trip.schedules.length;
  const firstSchedule = trip.schedules[0];

  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ▼ 追加：複製ボタンを押した時の処理
  function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // 1. 現在の旅行データを編集用の「ドラフト」に変換
    const copiedDraft = tripToDraft(trip);
    
    // 2. 新規作成扱いにするため、IDを空にしてタイトルを変更
    copiedDraft.id = ""; 
    copiedDraft.title = `${copiedDraft.title || "無題のしおり"} のコピー`;

    // 3. 一時保存（セッション）に書き込んでから、編集画面へ飛ぶ
    saveDraftToSession(copiedDraft);
    router.push("/edit");
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(false);
  }

  async function handleConfirmDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);

    try {
      await deleteTripAction(trip.id);
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

        {/* ▼ 修正：ボタンを横に並べるための flex コンテナに変更 */}
        <div className="absolute bottom-3 right-3 z-10 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
          {/* 複製ボタン */}
          <button
            onClick={handleDuplicate}
            className="rounded-md bg-stone-100 px-2.5 py-1.5 text-[11px] font-bold text-stone-600 transition-all hover:bg-stone-200"
          >
            📄 複製
          </button>

          {/* 削除ボタン */}
          <button
            onClick={handleDeleteClick}
            className="rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-500 transition-all hover:bg-red-100"
          >
            🗑️ 削除
          </button>
        </div>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity"
          onClick={handleCancel}
        >
          <div 
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-stone-800">しおりの削除</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                「<span className="font-bold">{trip.title || "無題のしおり"}</span>」を削除してもよろしいですか？<br />
                この操作は取り消せません。
              </p>
            </div>
            
            <div className="flex border-t border-stone-100 bg-stone-50">
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="flex-1 py-4 text-sm font-bold text-stone-500 hover:bg-stone-100 disabled:opacity-50"
              >
                削除しない
              </button>
              
              <div className="w-px bg-stone-100" />
              
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