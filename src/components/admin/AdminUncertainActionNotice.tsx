"use client";

import { secondaryButtonClassName } from "@/components/owner/ListingFormFields";

export function AdminUncertainActionNotice() {
  return (
    <div
      aria-live="assertive"
      className="grid gap-3 rounded-[12px] bg-warn-soft p-4 text-[0.88rem] text-warn-ink"
      role="alert"
    >
      <p className="m-0">
        The outcome of this action isn’t confirmed. Refresh the current status
        before trying again.
      </p>
      <button
        className={`${secondaryButtonClassName} w-fit`}
        onClick={() => window.location.reload()}
        type="button"
      >
        Refresh status
      </button>
    </div>
  );
}
