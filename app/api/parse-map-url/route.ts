import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URLがありません" }, { status: 400 });
    }

    // ① Googleにこっそりアクセスして、短縮URLから元の長いURLにリダイレクトさせる
    const response = await fetch(url, { redirect: "follow" });
    const finalUrl = response.url;

    let lat = null;
    let lng = null;

    // ▼ 修正：優先順位を変更！
    // 優先順位1: まず「正確なピンの位置（!3d〇〇!4d〇〇）」を探す
    const matchD = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    
    if (matchD) {
      lat = parseFloat(matchD[1]);
      lng = parseFloat(matchD[2]);
    } else {
      // 優先順位2: ピンが見つからなかった場合のみ「画面の中央位置（@〇〇,〇〇）」を使う
      const matchAt = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (matchAt) {
        lat = parseFloat(matchAt[1]);
        lng = parseFloat(matchAt[2]);
      }
    }

    // ③ うまく抜き出せたら画面側に返す
    if (lat && lng) {
      return NextResponse.json({ lat, lng, finalUrl });
    } else {
      return NextResponse.json(
        { error: "URLから座標を見つけられませんでした", finalUrl },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "解析サーバーでエラーが発生しました" },
      { status: 500 }
    );
  }
}