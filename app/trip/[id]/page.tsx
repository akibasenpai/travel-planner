import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { TripPreview } from "@/components/trips/TripPreview";
import { getTripById } from "@/lib/db/trips";
import { tripToDraft } from "@/lib/types/trip";

type TripDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params;
  const trip = await getTripById(id);

  if (!trip) {
    notFound();
  }

  return (
    <PageContainer className="bg-white">
      <AppHeader
        backHref="/"
        backLabel="トップへ"
        actionHref={`/edit/${id}`}
        actionLabel="編集する"
      />
      <main className="flex-1 px-4 py-6 pb-8">
        <TripPreview draft={tripToDraft(trip)} screenshotMode />
      </main>
      <footer className="shrink-0 px-4 pb-8 text-center">
        <Link
          href="/"
          className="text-xs text-stone-400 transition-colors hover:text-primary-strong"
        >
          たびめも トップへ戻る
        </Link>
      </footer>
    </PageContainer>
  );
}
