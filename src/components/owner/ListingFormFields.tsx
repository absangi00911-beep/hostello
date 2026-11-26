import type { ReactNode } from "react";

export const fieldClassName =
  "min-h-[46px] w-full rounded-[8px] border border-muted bg-white px-[13px] py-2 text-body text-ink aria-[invalid=true]:border-danger focus-visible:border-brand! focus-visible:outline-brand!";

export const primaryButtonClassName =
  "inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand px-5 text-body font-[650] text-white no-underline enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-2!";

export const secondaryButtonClassName =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[8px] border border-line bg-white px-4 text-label font-semibold text-ink no-underline shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 hover:border-line-strong hover:bg-surface-muted active:translate-y-px active:bg-line active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2! focus-visible:outline-brand! btn-secondary";

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
      <label className="text-label font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="m-0 text-label text-muted" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 text-label text-danger" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormSection({
  children,
  description,
  id,
  title,
}: {
  children: ReactNode;
  description?: string;
  id?: string;
  title: string;
}) {
  return (
    <section
      className="grid scroll-mt-24 gap-4 rounded-[16px] border border-line bg-surface p-5 sm:p-6"
      id={id}
    >
      <div>
        <h2 className="m-0 text-title font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mb-0 mt-1 text-label text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
