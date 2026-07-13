"use client";

import { useEffect, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { ScheduleItem } from "@/lib/types/trip";

// ▼ 修正：親画面からデータを受け取る「入り口（型定義）」を復活させました
type TripMapProps = {
  schedules?: ScheduleItem[];
  onDurationsCalculated?: (durations: string[]) => void;
  onDistancesCalculated?: (distances: string[]) => void;
  showRoute?: boolean;
};

export function TripMap({ schedules, onDurationsCalculated, onDistancesCalculated, showRoute }: TripMapProps) {
  const [diagnosticLog, setDiagnosticLog] = useState<string>("🔄 Google Maps APIを診断中...");

  useEffect(() => {
    async function runDiagnostic() {
      try {
        setOptions({
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          v: "weekly",
          region: "JP",
          language: "ja"
        });

        const routesLib = await importLibrary("routes") as any;
        const ds = new routesLib.DirectionsService();

        // 確実な「明日の昼12時」をセット
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);

        // 4パターンの検証テスト
        const testCases = [
          { 
            name: "テスト1: 車の計算（API自体が生きているか）", 
            req: { origin: "池袋駅, 日本", destination: "大宮駅, 日本", travelMode: 'DRIVING' } 
          },
          { 
            name: "テスト2: 近距離の電車（電車検索機能が有効か）", 
            req: { origin: "新宿駅, 日本", destination: "渋谷駅, 日本", travelMode: 'TRANSIT', transitOptions: { departureTime: tomorrow } } 
          },
          { 
            name: "テスト3: 新幹線の駅名検索（新幹線の時刻表に対応しているか）", 
            req: { origin: "大宮駅, 日本", destination: "越後湯沢駅, 日本", travelMode: 'TRANSIT', transitOptions: { departureTime: tomorrow } } 
          },
          { 
            name: "テスト4: 今回の座標での検索（ピンの位置が原因か）", 
            req: { origin: {lat: 35.9064485, lng: 139.6238548}, destination: {lat: 36.9359839, lng: 138.8096335}, travelMode: 'TRANSIT', transitOptions: { departureTime: tomorrow } } 
          }
        ];

        let logs = "【🔍 API診断レポート】\n\n";

        for (const tc of testCases) {
          const res: any = await new Promise((resolve) => {
            ds.route(tc.req, (result: any, status: any) => resolve({ status, result }));
          });
          logs += `■ ${tc.name}\n結果: ${res.status}\n`;
          if (res.status !== 'OK') {
            logs += `詳細: ${JSON.stringify(tc.req)}\n`;
          }
          logs += "------------------------\n";
        }

        setDiagnosticLog(logs);

      } catch (e: any) {
        setDiagnosticLog("🚨 重大なエラーが発生しました: " + e.message);
      }
    }
    
    runDiagnostic();
  }, []);

  return (
    <div className="rounded-2xl border-2 border-red-400 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-red-600 mb-4 text-lg">🚨 原因特定のための診断モード起動中</h3>
      <pre className="whitespace-pre-wrap text-sm font-mono text-stone-700 bg-stone-50 p-4 rounded-lg">
        {diagnosticLog}
      </pre>
      <p className="mt-4 text-sm font-bold text-stone-600">
        👆 上記の【API診断レポート】の中身をコピーして、そのまま私に教えてください。
      </p>
    </div>
  );
}