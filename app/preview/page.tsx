import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { PreviewPageClient } from "@/components/trips/PreviewPageClient";

export default function PreviewPage() {
  return (
    <PageContainer>
      <AppHeader title="プレビュー" />
      <main className="flex-1 px-4 py-5 pb-10">
        <PreviewPageClient />
      </main>
    </PageContainer>
  );
}
