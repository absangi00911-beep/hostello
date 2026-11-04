"use client";

import { StatePanel, statePrimaryClassName } from "./StatePanel";
import { siteCopy } from "@/lib/site-copy";

/**
 * Body for every error.tsx. Next.js 16.4 passes `retry` (not `reset`) to
 * error boundaries. The error itself is intentionally never rendered: users
 * get a fixed message, and the digest stays in server logs.
 */
export function RouteError({
  backHref,
  backLabel,
  retry,
}: {
  backHref?: string;
  backLabel?: string;
  retry: () => void;
}) {
  const { states } = siteCopy;

  return (
    <div role="alert">
      <StatePanel
        actions={
          <button
            className={statePrimaryClassName}
            onClick={() => retry()}
            type="button"
          >
            {states.retry}
          </button>
        }
        backHref={backHref}
        backLabel={backLabel}
        body={states.errorBody}
        title={states.errorTitle}
      />
    </div>
  );
}
