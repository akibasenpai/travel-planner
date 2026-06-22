"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { ScheduleItem } from "@/lib/types/trip";
import { parseDatetime } from "@/lib/utils/datetime";

type TripMapProps = {
  schedules?: ScheduleItem[];
  // ▼ 追加：計算した時間を親に渡すための枠組み
  onDurationsCalculated?: (durations: string[]) => void;
};

export function TripMap({ schedules = [], onDurationsCalculated }: TripMapProps) {
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

          // ピンをクリックした時だけ吹き出しを開く
          marker.addListener("click", () => {
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
          });
        });

        if (validCoordinates.length > 1) {
          const directionsService = new DirectionsService();
          const directionsRenderer = new DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#eab308",
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          });

          const origin = { lat: validCoordinates[0].lat!, lng: validCoordinates[0].lng! };
          const destination = { lat: validCoordinates[validCoordinates.length - 1].lat!, lng: validCoordinates[validCoordinates.length - 1].lng! };
          
          const waypoints = validCoordinates.slice(1, -1).map((place) => ({
            location: { lat: place.lat!, lng: place.lng! },
            stopover: true,
          }));

          directionsService.route(
            {
              origin,
              destination,
              waypoints,
              travelMode: 'DRIVING', // ※現状はルート描画の仕様上「車ベース」の時間を取得します
            },
            (result: any, status: any) => {
              if (status === 'OK' && result) {
                directionsRenderer.setDirections(result);
                
                // ▼ 追加：各区間の移動時間（〇〇分）を取り出して、親コンポーネントに渡す！
                if (onDurationsCalculated && result.routes[0]?.legs) {
                  const legs = result.routes[0].legs;
                  const newDurations: string[] = [];
                  let legIdx = 0;
                  
                  schedules.forEach((item, i) => {
                    if (i < schedules.length - 1 && item.lat && item.lng) {
                      newDurations[i] = legs[legIdx]?.duration?.text || "";
                      legIdx++;
                    } else {
                      newDurations[i] = "";
                    }
                  });
                  onDurationsCalculated(newDurations);
                }
              }
            }
          );
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
  }, [schedules]);

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
      {/* ▼ 修正：高さを 400px から 70vh（画面の70%）に変更し、PC用の最大サイズも指定 */}
      <div ref={mapRef} className="h-[70vh] min-h-[400px] max-h-[700px] w-full bg-stone-50" />
    </div>
  );
}