import type { ScheduleItem } from "@/lib/types/trip";
import { formatDatetimeDisplay, parseDatetime } from "@/lib/utils/datetime";
import { TextWithLinks } from "@/components/ui/TextWithLinks";

type TripTimelineProps = {
  schedules: ScheduleItem[];
  screenshotMode?: boolean;
  durations?: string[];
  distances?: string[];
  showRoute?: boolean;
};

export function TripTimeline({
  schedules,
  screenshotMode = false,
  durations = [],
  distances = [],
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
        const distanceText = distances[index] || "";

        // ▼ 追加：次の目的地がある場合、区間ごとのGoogleマップ起動URLを生成する
        const nextSchedule = schedules[index + 1];
        let segmentMapUrl = "";
        if (schedule.lat && schedule.lng && nextSchedule?.lat && nextSchedule?.lng) {
          const origin = `${schedule.lat},${schedule.lng}`;
          const destination = `${nextSchedule.lat},${nextSchedule.lng}`;
          // URL用に移動手段を変換（車: driving, 電車: transit, 徒歩: walking）
          const mode = schedule.travel_mode === 'transit' ? 'transit' : schedule.travel_mode === 'walking' ? 'walking' : 'driving';
          segmentMapUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
        }

        return (
          <li key={index} className="relative flex gap-4 pb-12 last:pb-0">
            {index < schedules.length - 1 ? (
              <>
                <span
                  className="absolute left-[9px] top-5 h-[calc(100%-20px)] w-0.5 bg-primary"
                  aria-hidden
                />
                {showRoute && (
                  <div className="absolute bottom-3 left-[24px] z-20 flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-bold text-stone-600 shadow-sm whitespace-nowrap">
                    <span className="text-stone-400">↓</span>
                    <span>{travelModeIcon}</span>
                    {durationText && <span className="ml-0.5 text-primary-strong">{durationText}</span>}
                    {distanceText && <span className="ml-0.5 font-medium text-stone-400">({distanceText})</span>}
                    
                    {/* ▼ 追加：区間ごとのナビゲーション起動ボタン（スクショ時は非表示） */}
                    {segmentMapUrl && (
                      <a
                        href={segmentMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1.5 flex items-center gap-0.5 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500 transition-colors hover:bg-primary hover:text-white"
                        title="Googleマップでこの区間の経路を開く"
                      >
                        ナビ ↗
                      </a>
                    )}
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