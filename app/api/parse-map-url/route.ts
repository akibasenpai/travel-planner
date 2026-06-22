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

    // ② 長いURLの中から、正規表現を使って「緯度(lat)」と「経度(lng)」の数字を抜き出す
    // パターンA: @35.681,139.767 のような形式
    const matchAt = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (matchAt) {
      lat = parseFloat(matchAt[1]);
      lng = parseFloat(matchAt[2]);
    } else {
      // パターンB: !3d35.681!4d139.767 のような形式
      const matchD = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (matchD) {
        lat = parseFloat(matchD[1]);
        lng = parseFloat(matchD[2]);
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