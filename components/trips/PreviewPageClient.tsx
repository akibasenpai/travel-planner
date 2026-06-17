"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TripDraft } from "@/lib/types/trip";
import {
  clearDraftFromSession,
  loadDraftFromSession,
} from "@/lib/draft/session";
import { TripPreview } from "@/components/trips/TripPreview";
import { saveTripAction } from "@/app/actions/trips";
import { btnPrimary, btnSecondary } from "@/lib/ui/classes";

export function PreviewPageClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const loaded = loadDraftFromSession();
    if (!loaded) {
      router.replace("/edit");
      return;
    }
    setDraft(loaded);
  }, [router]);

  function handleBack() {
    router.back();
  }

  function handleSave() {
    if (!draft) return;

    setError(null);
    startTransition(async () => {
      try {
        const saved = await saveTripAction(draft);
        clearDraftFromSession();
        router.push(`/trip/${saved.id}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "保存に失敗しました。",
        );
      }
    });
  }

  if (!draft) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-stone-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TripPreview draft={draft} />

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pb-4">
        <button type="button" onClick={handleBack} className={btnSecondary}>
          修正する
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={btnPrimary}
        >
          {isPending ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}
