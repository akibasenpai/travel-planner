import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-primary-subtle ${className}`}>
      {children}
    </div>
  );
}
