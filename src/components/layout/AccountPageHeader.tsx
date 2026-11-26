import type { ReactNode } from "react";

export function AccountPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div>
        <h1 className="m-0 text-display font-semibold tracking-[-0.035em] text-ink">
          {title}
        </h1>
        <div className="mt-2 text-body leading-6 text-muted">
          {description}
        </div>
      </div>
      {action ? <div className="flex-none">{action}</div> : null}
    </header>
  );
}
