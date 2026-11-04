import Link from "next/link";
import type { ReactNode } from "react";
import { siteCopy } from "@/lib/site-copy";

export const stateActionClassName =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[8px] px-5 text-base font-[650] no-underline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2";

export const statePrimaryClassName = `${stateActionClassName} border-0 bg-brand text-white hover:bg-brand-dark`;
export const stateSecondaryClassName = `${stateActionClassName} border border-line bg-white text-ink hover:bg-surface-muted`;

/**
 * Shared layout for not-found and error states: a heading, a plain-language
 * message, and a way back to the listings. Never pass raw error details here.
 */
export function StatePanel({
  actions,
  backHref = "/",
  backLabel = siteCopy.states.backToListings,
  body,
  title,
}: {
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  body: string;
  title: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-[560px] flex-col items-start justify-center px-5 py-16">
      <h1 className="m-0 text-[1.75rem] font-bold leading-tight text-ink">
        {title}
      </h1>
      <p className="mb-0 mt-3 text-base leading-[1.5] text-muted">{body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {actions}
        <Link
          className={actions ? stateSecondaryClassName : statePrimaryClassName}
          href={backHref}
        >
          {backLabel}
        </Link>
      </div>
    </main>
  );
}
