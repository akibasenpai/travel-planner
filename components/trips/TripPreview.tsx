import type { TripDraft } from "@/lib/types/trip";
import { TripTimeline } from "@/components/trips/TripTimeline";
import { TripMap } from "@/components/trips/TripMap"; // 👈 追加：地図の部品を読み込む
import { TextWithLinks } from "@/components/ui/TextWithLinks";

type TripPreviewProps = {
  draft: TripDraft;
  screenshotMode?: boolean;
};

export function TripPreview({ draft, screenshotMode = false }: TripPreviewProps) {
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

      {/* ▼ 追加：タイムラインの上にルートマップを配置！ */}
      <div className="mb-8">
        <TripMap schedules={draft.schedules} />
      </div>

      <TripTimeline schedules={draft.schedules} screenshotMode={screenshotMode} />
    </article>
  );
}