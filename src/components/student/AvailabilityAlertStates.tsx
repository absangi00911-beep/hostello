"use client";

export function AvailabilityAlertsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading availability alerts"
      className="grid gap-3"
    >
      {[0, 1, 2].map((item) => (
        <div
          className="h-32 animate-pulse rounded-xl bg-surface-muted"
          key={item}
        />
      ))}
    </div>
  );
}

export function AvailabilityAlertsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-line p-5" role="alert">
      <p className="m-0 text-sm">{message}</p>
      <button
        className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}

export function AvailabilityAlertsEmpty({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <section className="rounded-xl border border-dashed border-line bg-surface-muted p-6 sm:p-8">
      <h2 className="m-0 text-lg font-semibold">
        You don’t have any availability alerts.
      </h2>
      <p className="mb-4 mt-2 text-sm leading-6 text-muted">
        Create an alert to hear when a hostel can fit your selected stay.
      </p>
      <button
        className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white"
        onClick={onCreate}
        type="button"
      >
        Create an alert
      </button>
    </section>
  );
}
