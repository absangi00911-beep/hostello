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
        <h1 className="m-0 text-[clamp(1.7rem,3vw,2.2rem)] font-semibold tracking-[-0.035em] text-ink">
          {title}
        </h1>
        <div className="mt-2 text-[0.95rem] leading-6 text-muted">
          {description}
        </div>
      </div>
      {action ? <div className="flex-none">{action}</div> : null}
    </header>
  );
}
