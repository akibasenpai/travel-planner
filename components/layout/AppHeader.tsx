import Link from "next/link";

type AppHeaderProps = {
  title?: string;
  backHref?: string;
  backLabel?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AppHeader({
  title = "たびめも",
  backHref,
  backLabel = "戻る",
  actionHref,
  actionLabel,
}: AppHeaderProps) {
  return (
    <header className="shrink-0 border-b border-primary/30 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-block text-xs text-stone-400 transition-colors hover:text-primary-strong"
            >
              ← {backLabel}
            </Link>
          ) : (
            <p className="text-xs font-semibold tracking-widest text-primary-strong">
              TABIMEMO
            </p>
          )}
          {title ? (
            <h1 className="mt-0.5 truncate text-lg font-bold text-stone-800">
              {title}
            </h1>
          ) : null}
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-dark transition-colors hover:bg-primary-strong hover:text-white"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
