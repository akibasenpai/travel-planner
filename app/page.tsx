import Link from "next/link";
// AppHeaderは直接画面に書き込むため、この画面では使用しません
import { PageContainer } from "@/components/layout/PageContainer";
import { TripCard } from "@/components/trips/TripCard";
import { getAllTrips } from "@/lib/db/trips";
import { btnPrimary } from "@/lib/ui/classes";

export default async function HomePage() {
  let trips: Awaited<ReturnType<typeof getAllTrips>> = [];
  let error: string | null = null;

  try {
    trips = await getAllTrips();
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "しおり一覧の取得に失敗しました。";
  }

  return (
    <PageContainer>
      {/* 修正箇所1: タイトルとクレジットの表示 */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-sm font-bold text-teal-600 tracking-wider">
          Tabimemo
        </p>
        <div className="flex items-baseline gap-3 mt-1">
          <h1 className="text-3xl font-extrabold text-stone-800">
            たびめも
          </h1>
          <span className="text-xs font-medium text-stone-500">
            Produced by あきばせんぱい
          </span>
        </div>
      </div>

      <main className="flex-1 space-y-5 px-4 py-5 pb-10">
        <section className="overflow-hidden rounded-2xl bg-primary p-5 shadow-sm">
          <p className="text-sm font-medium text-primary-dark">
            旅のしおりを、サクッと。
          </p>
          {/* 新規作成ボタン：薄いピンクに馴染む優しいクリーム色に変更 */}
          <Link 
            href="/edit" 
            className="flex items-center justify-center w-full py-4 mt-4 bg-stone-50 hover:bg-stone-100 text-stone-600 font-bold rounded-xl shadow-sm transition-colors"
          >
            ＋ 新規作成
          </Link>
        </section>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">データベースに接続できません</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">
              {error}
            </p>
            <p className="mt-2 text-xs text-amber-600">
              `.env.local` の設定と `supabase/schema.sql` の実行を確認してください。
            </p>
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/50 bg-white p-8 text-center">
            <p className="text-3xl">✈️</p>
            <p className="mt-2 text-sm font-medium text-stone-600">
              まだしおりがありません
            </p>
            <p className="mt-1 text-xs text-stone-400">
              「新規作成」から最初の旅行のしおりを作りましょう
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <TripCard trip={trip} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </PageContainer>
  );
}