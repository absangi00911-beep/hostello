"use client";

import { AvailabilityAlertCard } from "@/components/student/AvailabilityAlertCard";
import type { AlertRecord } from "@/components/student/availability-alert-types";

export function AvailabilityAlertList({
  alerts,
  hasMore,
  pending,
  onEdit,
  onToggle,
  onDelete,
  onCreateNew,
  onLoadMore,
}: {
  alerts: AlertRecord[];
  hasMore: boolean;
  pending: boolean;
  onEdit: (alert: AlertRecord) => void;
  onToggle: (alert: AlertRecord) => void;
  onDelete: (alert: AlertRecord) => void;
  onCreateNew: (alert: AlertRecord) => void;
  onLoadMore: () => void;
}) {
  return (
    <>
      <ul
        aria-label="Your availability alerts"
        className="m-0 grid list-none gap-3 p-0"
      >
        {alerts.map((alert) => (
          <AvailabilityAlertCard
            alert={alert}
            key={alert.id}
            onCreateNew={() => onCreateNew(alert)}
            onDelete={() => onDelete(alert)}
            onEdit={() => onEdit(alert)}
            onToggle={() => onToggle(alert)}
            pending={pending}
          />
        ))}
      </ul>
      {hasMore && (
        <div className="mt-5 flex justify-end">
          <button
            className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold"
            onClick={onLoadMore}
            type="button"
          >
            Load more alerts
          </button>
        </div>
      )}
    </>
  );
}
