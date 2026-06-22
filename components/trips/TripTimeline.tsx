import type { ScheduleItem } from "@/lib/types/trip";
import { formatDatetimeDisplay, parseDatetime } from "@/lib/utils/datetime";
import { TextWithLinks } from "@/components/ui/TextWithLinks";

type TripTimelineProps = {
  schedules: ScheduleItem[];
  screenshotMode?: boolean;
  durations?: string[];
  showRoute?: boolean; // 👈 追加：ルート表示の指令を受け取る
};

export function TripTimeline({
  schedules,
  screenshotMode = false,
  durations = [],
  showRoute = true,
}: TripTimelineProps) {
  if (schedules.length === 0) {
    return (
      <p className="text-sm text-stone-400">行程がまだ登録されていません。</p>
    );
  }

  let lastSeenDate = "";

  return (
    <ol className="relative space-y-0">
      {schedules.map((schedule, index) => {
        let displayDatetime = "";
        
        if (schedule.datetime) {
          const current = parseDatetime(schedule.datetime);
          const currentDeparture = parseDatetime(schedule.departure_datetime || "");
          
          let timeStr = current.time || "";
          if (currentDeparture.time) {
            timeStr = timeStr ? `${timeStr} 〜 ${currentDeparture.time}` : `〜 ${currentDeparture.time}`;
          }

          if (current.date) {
            if (current.date === lastSeenDate) {
              displayDatetime = timeStr; 
            } else {
              const formattedDateStr = formatDatetimeDisplay(schedule.datetime);
              const datePart = formattedDateStr.split(" ")[0] || formattedDateStr;
              displayDatetime = timeStr ? `${datePart}\n${timeStr}` : datePart;
              lastSeenDate = current.date;
            }
          } else {
            displayDatetime = timeStr || formatDatetimeDisplay(schedule.datetime).replace(" ", "\n");
          }
        }

        const travelModeIcon = 
          schedule.travel_mode === 'transit' ? '🚃' :
          schedule.travel_mode === 'walking' ? '🚶' : '🚗';
        const durationText = durations[index] || "";

        return (
          <li key={index} className="relative flex gap-4 pb-12 last:pb-0">
            {index < schedules.length - 1 ? (
              <>
                <span
                  className="absolute left-[9px] top-5 h-[calc(100%-20px)] w-0.5 bg-primary"
                  aria-hidden
                />
                {/* ▼ 修正：showRoute が true の時だけ移動アイコン（↓🚗 30分）を表示する */}
                {showRoute && (
                  <div className="absolute bottom-3 left-[24px] z-20 flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-bold text-stone-600 shadow-sm">
                    <span className="text-stone-400">↓</span>
                    <span>{travelModeIcon}</span>
                    {durationText && <span className="ml-0.5 text-primary-strong">{durationText}</span>}
                  </div>
                )}
              </>
            ) : null}
            
            <span
              className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                screenshotMode
                  ? "border-primary-strong bg-primary-strong text-white"
                  : "border-primary bg-white text-primary-dark"
              }`}
              aria-hidden
            >
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
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