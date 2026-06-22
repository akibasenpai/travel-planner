"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { ScheduleItem } from "@/lib/types/trip";
import { parseDatetime } from "@/lib/utils/datetime";

type TripMapProps = {
  schedules: ScheduleItem[];
};

export function TripMap({ schedules }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // 座標が保存されている工程だけを絞り込む
  const validCoordinates = schedules.filter(
    (item) => item.lat !== undefined && item.lng !== undefined
  );

  useEffect(() => {
    if (!mapRef.current || validCoordinates.length === 0) return;

    // .env.local から API キーを読み込む
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
    });

    // ▼ 修正：load() の代わりに、最新の importLibrary() を使って必要な機能を読み込む
    Promise.all([
      loader.importLibrary("maps"),
      loader.importLibrary("routes"),
      loader.importLibrary("marker")
    ]).then(() => {
      if (!mapRef.current) return;

      // 1. 地図の初期化（最初のスポットを中心に配置）
      const firstLocation = {
        lat: validCoordinates[0].lat!,
        lng: validCoordinates[0].lng!,
      };

      const map = new google.maps.Map(mapRef.current, {
        center: firstLocation,
        zoom: 13,
        mapId: "DEMO_MAP_ID", // 必須の識別子
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });

      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      // 2. ピン（マーカー）と吹き出し（インフォウィンドウ）の設定
      validCoordinates.forEach((schedule, index) => {
        const position = { lat: schedule.lat!, lng: schedule.lng! };
        bounds.extend(position);

        // 解析した時間データを取得
        const { time } = parseDatetime(schedule.datetime);
        const timeDisplay = time ? `[${time}] ` : "";

        // ピンを立てる
        const marker = new google.maps.Marker({
          position,
          map,
          // ピンの上に数字を表示（1, 2, 3...）
          label: {
            text: String(index + 1),
            color: "#white",
            fontWeight: "bold",
          },
          title: schedule.location,
        });

        // ピンの上に常に表示される「時間＋場所」の吹き出し
        const contentString = `
          <div style="padding: 4px; color: #1c1917;">
            <p style="font-size: 11px; font-weight: bold; margin: 0; color: #eab308;">${timeDisplay}</p>
            <p style="font-size: 13px; font-weight: bold; margin: 2px 0 0 0;">${schedule.location}</p>
          </div>
        `;

        // 常に吹き出しを開いた状態にする
        const markerInfoWindow = new google.maps.InfoWindow({
          content: contentString,
          disableAutoPan: true, // 画面が勝手に動くのを防ぐ
        });
        markerInfoWindow.open(map, marker);

        // ピンをクリックした時にも詳細が出るようにする
        marker.addListener("click", () => {
          infoWindow.setContent(contentString);
          infoWindow.open(map, marker);
        });
      });

      // 3. ルート（線）を引く
      // 2箇所場所以上あれば、自動的に道沿いのルートを計算して線を引く
      if (validCoordinates.length > 1) {
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true, // デフォルトの無機質なピンを非表示にして、自前のピンを活かす
          polylineOptions: {
            strokeColor: "#eab308", // アプリのプライマリカラー（黄色系）に合わせる
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        const origin = { lat: validCoordinates[0].lat!, lng: validCoordinates[0].lng! };
        const destination = { lat: validCoordinates[validCoordinates.length - 1].lat!, lng: validCoordinates[validCoordinates.length - 1].lng! };
        
        // 間の経由地を設定
        const waypoints = validCoordinates.slice(1, -1).map((place) => ({
          location: { lat: place.lat!, lng: place.lng! },
          stopover: true,
        }));

        directionsService.route(
          {
            origin,
            destination,
            waypoints,
            travelMode: google.maps.TravelMode.DRIVING, // 一旦すべて「車」ベースで線を引く
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              directionsRenderer.setDirections(result);
            }
          }
        );
      }

      // 全てのピンが画面に収まるように、地図の表示倍率を自動調整する
      if (validCoordinates.length > 1) {
        map.fitBounds(bounds);
      }
    });
  }, [schedules]);

  // 座標データがない場合は、地図エリア自体を非表示にする
  if (validCoordinates.length === 0) {
    return (
      <div className="rounded-2xl bg-stone-100 p-6 text-center text-sm text-stone-400">
        🗺️ 座標が解析された工程が登録されると、ここにルートマップが表示されます。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
      {/* 地図が描画される高さ400pxのエリア */}
      <div ref={mapRef} className="h-[400px] w-full bg-stone-50" />
    </div>
  );
}