import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";

export default function NotFound() {
  return (
    <PageContainer>
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-medium text-stone-500">
          しおりが見つかりませんでした
        </p>
        <Link
          href="/"
          className="mt-4 text-sm font-medium text-primary-strong hover:underline"
        >
          トップへ戻る
        </Link>
      </main>
    </PageContainer>
  );
}
