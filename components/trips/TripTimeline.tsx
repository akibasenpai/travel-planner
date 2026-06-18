import type { ScheduleItem } from "@/lib/types/trip";
import { formatDatetimeDisplay, parseDatetime } from "@/lib/utils/datetime"; // 👈 parseDatetime を追加
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

  return (
    <ol className="relative space-y-0">
      {schedules.map((schedule, index) => {
        // ▼ 追加：日時の計算ロジック
        let displayDatetime = "";
        if (schedule.datetime) {
          const current = parseDatetime(schedule.datetime);
          
          if (index > 0) {
            const prev = parseDatetime(schedules[index - 1].datetime);
            // 前の行程と日付が同じ場合、時間だけを取り出す
            if (current.date && prev.date && current.date === prev.date) {
              displayDatetime = current.time || ""; 
            } else {
              displayDatetime = formatDatetimeDisplay(schedule.datetime);
            }
          } else {
            // 最初の1件目は必ずフル表示
            displayDatetime = formatDatetimeDisplay(schedule.datetime);
          }
        }

        // ▼ 追加：計算が終わったので return で画面表示を返す
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
              {/* ▼ 修正: もともとの {formatDatetimeDisplay(...)} を {displayDatetime} に変更 */}
              {displayDatetime ? (
                <p className="text-xs font-semibold tracking-wide text-primary-strong">
                  {displayDatetime}
                </p>
              ) : null}
            {/* ▼ どこで ＆ 地図を見る を横並びにする */}
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

            {/* ▼ 何をするか（場所と地図の下に表示） */}
            {schedule.activity ? (
              <TextWithLinks
                text={schedule.activity}
                className="mt-1 text-sm leading-relaxed text-stone-600"
              />
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
