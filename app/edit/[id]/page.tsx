import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { TripEditFormFromTrip } from "@/components/trips/TripEditForm";
import { getTripById } from "@/lib/db/trips";

type EditTripPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { id } = await params;
  const trip = await getTripById(id);

  if (!trip) {
    notFound();
  }

  return (
    <PageContainer>
      <AppHeader
        title="しおりを編集"
        backHref={`/trip/${id}`}
        backLabel="詳細へ"
      />
      <main className="flex-1 px-4 py-5 pb-10">
        <TripEditFormFromTrip trip={trip} />
      </main>
    </PageContainer>
  );
}
