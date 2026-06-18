import type { ScheduleItem } from "@/lib/types/trip";
import { formatDatetimeDisplay, parseDatetime } from "@/lib/utils/datetime";
import { TextWithLinks } from "@/components/ui/TextWithLinks";

type TripTimelineProps = {
  schedules: ScheduleItem[];
  screenshotMode?: boolean;
};

export function TripTimeline({
  schedules,
  screenshotMode = false,
}: TripTimelineProps) {
  if (schedules.length === 0) {
    return (
      <p className="text-sm text-stone-400">行程がまだ登録されていません。</p>
    );
  }

  // 最後に表示した日付を記憶しておく変数
  let lastSeenDate = "";

  return (
    <ol className="relative space-y-0">
      {schedules.map((schedule, index) => {
        let displayDatetime = "";
        
        if (schedule.datetime) {
          const current = parseDatetime(schedule.datetime);

          if (current.date) {
            if (current.date === lastSeenDate) {
              // 同じ日付なら時間のみ
              displayDatetime = current.time || ""; 
            } else {
              // ▼ 新しい日付ならフル表示し、日付と時間の間のスペースを改行(\n)に変換
              const formatted = formatDatetimeDisplay(schedule.datetime);
              displayDatetime = formatted.replace(" ", "\n");
              lastSeenDate = current.date;
            }
          } else {
            // 時間のみ、または古いデータの場合もスペースがあれば改行に変換
            displayDatetime = formatDatetimeDisplay(schedule.datetime).replace(" ", "\n");
          }
        }

        return (
          <li key={index} className="relative flex gap-4 pb-8 last:pb-0">
            {index < schedules.length - 1 ? (
              <span
                className="absolute left-[7px] top-3 h-[calc(100%-12px)] w-0.5 bg-primary"
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                screenshotMode
                  ? "border-primary-strong bg-primary-strong"
                  : "border-primary bg-white"
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              {/* ▼ whitespace-pre-wrap を追加して改行を有効にする */}
              {displayDatetime ? (
                <p className="whitespace-pre-wrap text-xs font-semibold tracking-wide text-primary-strong">
                  {displayDatetime}
                </p>
              ) : null}
            
            <div className="mt-0.5 flex items-center gap-3">
              {schedule.location ? (
                <p className="text-sm font-bold text-stone-800">
                  {schedule.location}
                </p>
              ) : null}
              {schedule.map_url ? (
                <a
                  href={schedule.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-bold text-primary-dark transition-colors hover:bg-primary-strong hover:text-white"
                >
                  地図を見る
                </a>
              ) : null}
            </div>

            {schedule.activity ? (
              <TextWithLinks
                text={schedule.activity}
                className="mt-1 text-sm leading-relaxed text-stone-600"
              />
            ) : null}
          </div>
        </li>
        );
      })}
    </ol>
  );
}
