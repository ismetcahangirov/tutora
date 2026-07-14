import type { ReactNode } from 'react';

/** Consistent content container: centered, max-width, page padding. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6 lg:py-8">{children}</div>
  );
}

/** Standard page heading with an optional description and trailing actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
