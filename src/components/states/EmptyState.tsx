import type { ReactNode } from "react";

export function EmptyState({
  actions,
  body,
  title,
}: {
  actions?: ReactNode;
  body: string;
  title: string;
}) {
  return (
    <section
      aria-live="polite"
      className="mx-auto w-full max-w-[560px] py-12 text-center"
      role="status"
    >
      <h2 className="m-0 text-xl font-semibold text-ink">{title}</h2>
      <p className="mb-0 mt-2 text-base leading-[1.5] text-muted">{body}</p>
      {actions && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
      )}
    </section>
  );
}
