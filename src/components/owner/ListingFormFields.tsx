import type { ReactNode } from "react";

export const fieldClassName =
  "min-h-[46px] w-full rounded-[8px] border border-muted bg-white px-[13px] py-2 text-base text-ink aria-[invalid=true]:border-[#c13515] focus-visible:border-brand! focus-visible:outline-brand!";

export const primaryButtonClassName =
  "inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand px-5 text-base font-[650] text-white no-underline enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-2!";

export const secondaryButtonClassName =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[8px] border border-line bg-white px-4 text-[0.85rem] font-semibold text-ink no-underline hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2! focus-visible:outline-brand!";

/** aria wiring shared by every control so errors and hints are announced. */
export function controlProps(id: string, error?: string, hint?: string) {
  const describedBy =
    [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return {
    id,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
  };
}

export function Field({
  children,
  error,
  hint,
  id,
  label,
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-[6px]">
      <label className="text-[0.875rem] font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="m-0 text-[0.78rem] text-muted" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 text-[0.82rem] text-[#c13515]" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="grid gap-4 rounded-[16px] border border-line bg-surface p-5 sm:p-6">
      <div>
        <h2 className="m-0 text-[1.1rem] font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mb-0 mt-1 text-[0.88rem] text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
