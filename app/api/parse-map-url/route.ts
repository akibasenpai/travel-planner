import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URLがありません" }, { status: 400 });
    }

    // ▼ 修正のキモ：サーバーが「PCのChromeブラウザ」のふりをしてアクセスする
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        // ここでPCブラウザの身分証明（User-Agent）を提示する
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    });

    // リダイレクト（転送）されきった最終的な長いURLを取得
    const finalUrl = response.url;

    let lat: number | null = null;
    let lng: number | null = null;

    // 1. ピンの正確な座標 (!3d...!4d...) を優先して探す
    const pinMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pinMatch) {
      lat = parseFloat(pinMatch[1]);
      lng = parseFloat(pinMatch[2]);
    } else {
      // 2. ピンが見つからなければ、画面中央の座標 (@...,...) を探す
      const centerMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (centerMatch) {
        lat = parseFloat(centerMatch[1]);
        lng = parseFloat(centerMatch[2]);
      }
    }

    if (lat !== null && lng !== null) {
      return NextResponse.json({ lat, lng, finalUrl });
    } else {
      return NextResponse.json(
        { error: "URLから座標を見つけられませんでした", finalUrl },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Map URL Parse Error:", error);
    return NextResponse.json(
      { error: "サーバーでの解析処理に失敗しました" },
      { status: 500 }
    );
  }
}