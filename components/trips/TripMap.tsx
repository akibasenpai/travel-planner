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
        const geometryLib = await importLibrary("geometry") as any; // ▼ 追加：直線距離の計算用

        if (!isMounted || !mapRef.current) return;

        const { Map, InfoWindow, Polyline } = mapsLib;
        const { LatLngBounds, LatLng } = coreLib;
        const { Marker } = markerLib;
        const { DirectionsService, DirectionsRenderer } = routesLib;
        const { spherical } = geometryLib;

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
            label: { text: String(index + 1), color: "#white", fontWeight: "bold" },
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
            const originLatLng = { lat: current.lat, lng: current.lng };
            const destLatLng = { lat: next.lat, lng: next.lng };

            // ▼ 変更のキモ：電車の場合はGoogleに頼らず「アプリ自力で計算」する
            if (mode === 'transit') {
              let durationText = "計算不可";
              let distanceMeters = 0;

              // ① 時間：しおりの「現在の出発時間」から「次の到着時間」を引き算する
              const departureStr = current.departure_datetime || current.datetime;
              const arrivalStr = next.datetime;

              if (departureStr && arrivalStr) {
                const startTime = new Date(departureStr.replace(' ', 'T'));
                const endTime = new Date(arrivalStr.replace(' ', 'T'));
                
                if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
                  const diffMs = endTime.getTime() - startTime.getTime();
                  if (diffMs > 0) {
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    durationText = hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
                  }
                }
              }

              // ② 距離：駅と駅の「直線距離（鳥の目線）」を算出する
              if (spherical) {
                distanceMeters = spherical.computeDistanceBetween(
                  new LatLng(originLatLng.lat, originLatLng.lng),
                  new LatLng(destLatLng.lat, destLatLng.lng)
                );
              }

              // ③ マップ：駅と駅を「青色の直線」で結ぶ
              new Polyline({
                path: [originLatLng, destLatLng],
                geodesic: true,
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 5,
                map: map
              });

              return { duration: durationText, distance: distanceMeters };
            }

            // 車・徒歩の場合は従来通りGoogleに計算してもらう
            const tryRoute = (originArg: any, destArg: any, tMode: string): Promise<any> => {
              return new Promise((resolve) => {
                directionsService.route(
                  { origin: originArg, destination: destArg, travelMode: tMode },
                  (result: any, status: any) => resolve({ result, status })
                );
              });
            };

            let travelMode = mode === 'walking' ? 'WALKING' : 'DRIVING';
            let strokeColor = mode === 'walking' ? '#22c55e' : '#eab308';

            let { result, status } = await tryRoute(originLatLng, destLatLng, travelMode);

            if (status === 'OVER_QUERY_LIMIT') {
              await new Promise(r => setTimeout(r, 1000));
              const retry = await tryRoute(originLatLng, destLatLng, travelMode);
              result = retry.result;
              status = retry.status;
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
                  newDistances[i] = `${Math.round(res.distance)}m`;
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