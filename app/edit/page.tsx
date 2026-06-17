import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { TripEditForm } from "@/components/trips/TripEditForm";

export default function NewTripPage() {
  return (
    <PageContainer>
      <AppHeader title="新規作成" backHref="/" backLabel="トップへ" />
      <main className="flex-1 px-4 py-5 pb-10">
        <TripEditForm />
      </main>
    </PageContainer>
  );
}
