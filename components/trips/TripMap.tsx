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

          const fetchRouteSegment = (origin: any, destination: any, mode: string) => {
            return new Promise<any>((resolve) => {
              let travelMode = 'DRIVING';
              let strokeColor = '#eab308'; // 車は黄色

              if (mode === 'transit') {
                travelMode = 'TRANSIT';
                strokeColor = '#3b82f6'; // 電車は青色
              } else if (mode === 'walking') {
                travelMode = 'WALKING';
                strokeColor = '#22c55e'; // 徒歩は緑色
              }

              // ▼ 修正：リクエストデータを作成
              const request: any = {
                origin,
                destination,
                travelMode
              };

              // ▼ 修正：電車の場合は「出発時刻（計算時点の現在時刻）」を必須で渡す
              if (travelMode === 'TRANSIT') {
                request.transitOptions = {
                  departureTime: new Date(),
                };
              }

              directionsService.route(
                request,
                (result: any, status: any) => {
                  if (status === 'OK' && result) {
                    const renderer = new DirectionsRenderer({
                      map,
                      suppressMarkers: true,
                      preserveViewport: true, // ▼ 修正：ルート描画時に勝手にズームする機能をオフ！
                      polylineOptions: { strokeColor, strokeWeight: 5, strokeOpacity: 0.8 }
                    });
                    renderer.setDirections(result);
                    
                    const leg = result.routes[0].legs[0];
                    resolve({
                      duration: leg.duration?.text || "",
                      distance: leg.distance?.value || 0
                    });
                  } else {
                    console.warn(`ルート計算失敗 (${travelMode}):`, status);
                    resolve({ duration: "", distance: 0 }); 
                  }
                }
              );
            });
          };

          const routePromises = [];
          for (let i = 0; i < validCoordinates.length - 1; i++) {
            const origin = { lat: validCoordinates[i].lat!, lng: validCoordinates[i].lng! };
            const destination = { lat: validCoordinates[i + 1].lat!, lng: validCoordinates[i + 1].lng! };
            const travelMode = validCoordinates[i].travel_mode || 'driving';
            routePromises.push(fetchRouteSegment(origin, destination, travelMode));
          }

          Promise.all(routePromises).then((results) => {
            const newDurations: string[] = [];
            const newDistances: string[] = [];
            let resultIdx = 0;

            schedules.forEach((item, i) => {
              if (i < schedules.length - 1 && item.lat && item.lng) {
                const res = results[resultIdx];
                newDurations[i] = res.duration;

                if (res.distance >= 1000) {
                  newDistances[i] = `${(res.distance / 1000).toFixed(1)}km`;
                } else if (res.distance > 0) {
                  newDistances[i] = `${res.distance}m`;
                } else {
                  newDistances[i] = "";
                }
                resultIdx++;
              } else {
                newDurations[i] = "";
                newDistances[i] = "";
              }
            });

            if (onDurationsCalculated) onDurationsCalculated(newDurations);
            if (onDistancesCalculated) onDistancesCalculated(newDistances);
          });

        } else {
          if (onDurationsCalculated) onDurationsCalculated([]);
          if (onDistancesCalculated) onDistancesCalculated([]);
        }

        // ▼ 全てのピンが収まるように広域表示に合わせる（ここはそのまま活きます！）
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