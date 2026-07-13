"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { ScheduleItem } from "@/lib/types/trip";
import { parseDatetime } from "@/lib/utils/datetime";

type TripMapProps = {
  schedules?: ScheduleItem[];
  onDurationsCalculated?: (durations: string[]) => void;
  onDistancesCalculated?: (distances: string[]) => void;
  showRoute?: boolean;
};

export function TripMap({ schedules = [], onDurationsCalculated, onDistancesCalculated, showRoute = true }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const validCoordinates = safeSchedules.filter(
    (item) => item && item.lat !== undefined && item.lng !== undefined
  );

  useEffect(() => {
    if (!mapRef.current || validCoordinates.length === 0) return;

    let isMounted = true;

    async function initMap() {
      try {
        // ▼ 追加：日本国内のルート検索に最適化するための設定
        setOptions({
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          v: "weekly",
          region: "JP",
          language: "ja"
        });

        const mapsLib = await importLibrary("maps") as any;
        const coreLib = await importLibrary("core") as any;
        const markerLib = await importLibrary("marker") as any;
        const routesLib = await importLibrary("routes") as any;

        if (!isMounted || !mapRef.current) return;

        const { Map, InfoWindow } = mapsLib;
        const { LatLngBounds } = coreLib;
        const { Marker } = markerLib;
        const { DirectionsService, DirectionsRenderer } = routesLib;

        const firstLocation = {
          lat: validCoordinates[0].lat!,
          lng: validCoordinates[0].lng!,
        };

        const map = new Map(mapRef.current, {
          center: firstLocation,
          zoom: 13,
          mapId: "DEMO_MAP_ID",
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        const bounds = new LatLngBounds();
        const infoWindow = new InfoWindow();

        validCoordinates.forEach((schedule, index) => {
          const position = { lat: schedule.lat!, lng: schedule.lng! };
          bounds.extend(position);

          const { time } = parseDatetime(schedule.datetime || "");
          const timeDisplay = time ? `[${time}]` : "";

          const marker = new Marker({
            position,
            map,
            label: {
              text: String(index + 1),
              color: "#white",
              fontWeight: "bold",
            },
            title: schedule.location || "",
          });

          const contentString = `
            <div style="padding: 1px 2px; color: #1c1917; line-height: 1.2; display: flex; gap: 4px; align-items: center;">
              <span style="font-size: 10px; font-weight: bold; color: #eab308;">${timeDisplay}</span>
              <span style="font-size: 11px; font-weight: bold;">${schedule.location || ""}</span>
            </div>
          `;

          const markerInfoWindow = new InfoWindow({
            content: contentString,
            disableAutoPan: true,
          });

          marker.addListener("click", () => {
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
          });
        });

        if (showRoute && validCoordinates.length > 1) {
          const directionsService = new DirectionsService();

          const fetchRouteSegment = async (current: any, next: any, mode: string) => {
            const tryRoute = (originArg: any, destArg: any, tMode: string, depTime: Date): Promise<any> => {
              return new Promise((resolve) => {
                const request: any = { origin: originArg, destination: destArg, travelMode: tMode };
                if (tMode === 'TRANSIT') {
                  request.transitOptions = { departureTime: depTime };
                }
                directionsService.route(request, (result: any, status: any) => {
                  resolve({ result, status });
                });
              });
            };

            let travelMode = 'DRIVING';
            let strokeColor = '#eab308';
            if (mode === 'transit') { travelMode = 'TRANSIT'; strokeColor = '#3b82f6'; }
            else if (mode === 'walking') { travelMode = 'WALKING'; strokeColor = '#22c55e'; }

            const originLatLng = { lat: current.lat, lng: current.lng };
            const destLatLng = { lat: next.lat, lng: next.lng };

            // 出発時刻を決定
            let userTime = new Date();
            userTime.setDate(userTime.getDate() + 1);
            userTime.setHours(12, 0, 0, 0);

            const targetDatetime = current.departure_datetime || current.datetime;
            if (targetDatetime) {
              const safeStr = targetDatetime.replace(' ', 'T');
              const parsedDate = new Date(safeStr);
              if (!isNaN(parsedDate.getTime()) && parsedDate.getTime() > Date.now()) {
                userTime = parsedDate;
              }
            }

            // 1回目の挑戦：指定された日時と座標で計算
            let { result, status } = await tryRoute(originLatLng, destLatLng, travelMode, userTime);

            if (status === 'OVER_QUERY_LIMIT') {
              await new Promise(r => setTimeout(r, 1000));
              const retry = await tryRoute(originLatLng, destLatLng, travelMode, userTime);
              result = retry.result;
              status = retry.status;
            }

            // ▼ 修正のキモ：日付が先すぎて時刻表がない等のエラーの場合の救済措置
            if (status === 'ZERO_RESULTS' && travelMode === 'TRANSIT') {
              // 救済策1：出発時間を「明日の同じ時間」にすり替えて再計算（時刻表切れ対策）
              const fallbackTime = new Date();
              fallbackTime.setDate(fallbackTime.getDate() + 1);
              fallbackTime.setHours(userTime.getHours(), userTime.getMinutes(), 0, 0);
              
              const retryDate = await tryRoute(originLatLng, destLatLng, 'TRANSIT', fallbackTime);
              if (retryDate.status === 'OK') {
                result = retryDate.result;
                status = retryDate.status;
              } else {
                // 救済策2：それでもダメなら座標が線路の上と判定されている。駅名（テキスト）で再計算
                const originName = current.location ? `${current.location}, 日本` : originLatLng;
                const destName = next.location ? `${next.location}, 日本` : destLatLng;
                const retryText = await tryRoute(originName, destName, 'TRANSIT', fallbackTime);
                if (retryText.status === 'OK') {
                  result = retryText.result;
                  status = retryText.status;
                }
              }
            }

            // 最終防衛線：あらゆる手段を使っても電車に乗れなかった場合だけ、車にする
            if (status === 'ZERO_RESULTS' && travelMode === 'TRANSIT') {
              const fallback = await tryRoute(originLatLng, destLatLng, 'DRIVING', new Date());
              result = fallback.result;
              status = fallback.status;
              strokeColor = '#eab308';
            }

            if (status === 'OK' && result) {
              const renderer = new DirectionsRenderer({
                map,
                suppressMarkers: true,
                preserveViewport: true,
                polylineOptions: { strokeColor, strokeWeight: 5, strokeOpacity: 0.8 }
              });
              renderer.setDirections(result);
              const leg = result.routes[0].legs[0];
              return {
                duration: leg.duration?.text || "",
                distance: leg.distance?.value || 0
              };
            }
            return { duration: "計算不可", distance: 0 };
          };

          const processRoutes = async () => {
            const newDurations: string[] = [];
            const newDistances: string[] = [];

            for (let i = 0; i < safeSchedules.length - 1; i++) {
              const current = safeSchedules[i];
              const next = safeSchedules[i + 1];

              if (current.lat && current.lng && next.lat && next.lng) {
                const travelMode = current.travel_mode || 'driving';
                const res = await fetchRouteSegment(current, next, travelMode);
                
                if (!isMounted) return;

                newDurations[i] = res.duration;
                if (res.distance >= 1000) {
                  newDistances[i] = `${(res.distance / 1000).toFixed(1)}km`;
                } else if (res.distance > 0) {
                  newDistances[i] = `${res.distance}m`;
                } else {
                  newDistances[i] = res.duration === "計算不可" ? "-" : "";
                }
              } else {
                newDurations[i] = "";
                newDistances[i] = "";
              }
            }

            if (isMounted) {
              if (onDurationsCalculated) onDurationsCalculated(newDurations);
              if (onDistancesCalculated) onDistancesCalculated(newDistances);
            }
          };

          processRoutes();

        } else {
          if (onDurationsCalculated) onDurationsCalculated([]);
          if (onDistancesCalculated) onDistancesCalculated([]);
        }

        if (validCoordinates.length > 1) {
          map.fitBounds(bounds);
        }
      } catch (err) {
        console.error("地図の初期化エラー:", err);
        if (isMounted) setMapError(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [schedules, showRoute]);

  if (mapError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-500 shadow-sm">
        🗺️ 地図の読み込みに失敗しました。少し時間をおいて再読み込みするか、APIキーの設定を確認してください。
      </div>
    );
  }

  if (validCoordinates.length === 0) {
    return (
      <div className="rounded-2xl bg-stone-100 p-6 text-center text-sm text-stone-400">
        🗺️ 座標が解析された工程が登録されると、ここにルートマップが表示されます。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
      <div ref={mapRef} className="h-[70vh] min-h-[400px] max-h-[700px] w-full bg-stone-50" />
    </div>
  );
}