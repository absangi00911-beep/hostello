"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import type { SearchAlertCriteria } from "@/lib/availability-alert-criteria";
import type { AvailabilityAlertFormInitial } from "@/components/student/availability-alert-form-model";
import type { AlertRecord } from "@/components/student/availability-alert-types";

export function describeAvailabilityAlert(alert: AlertRecord) {
  if (alert.type === "HOSTEL") return alert.hostelName || "Selected hostel";

  const criteria = alert.criteria as SearchAlertCriteria;
  const parts: string[] = [];
  if (criteria.q) parts.push(`“${criteria.q}”`);
  if (criteria.city) parts.push(criteria.city);
  if (criteria.gender) {
    parts.push(
      criteria.gender === "FEMALE"
        ? "Women"
        : criteria.gender === "MALE"
          ? "Men"
          : "Mixed",
    );
  }
  if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
    parts.push(
      `PKR ${criteria.minPrice ?? 0}–${criteria.maxPrice ?? "no maximum"}`,
    );
  }
  if (criteria.amenities?.length) {
    parts.push(
      `${criteria.amenities.length} amenit${criteria.amenities.length === 1 ? "y" : "ies"}`,
    );
  }
  if (criteria.verified) parts.push("Verified");
  if (criteria.nearby) parts.push("Nearby");
  return parts.length ? parts.join(" · ") : "All public listings";
}

function dateLabel(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function toAvailabilityAlertFormInitial(
  alert: AlertRecord,
): AvailabilityAlertFormInitial {
  if (alert.type === "HOSTEL") {
    return {
      id: alert.id,
      type: "HOSTEL",
      hostelId: typeof alert.criteria.hostelId === "string"
        ? alert.criteria.hostelId
        : "",
      checkIn: alert.checkIn,
      checkOut: alert.checkOut,
      guests: alert.guests,
    };
  }
  return {
    id: alert.id,
    type: "SEARCH",
    criteria: alert.criteria as SearchAlertCriteria,
    checkIn: alert.checkIn,
    checkOut: alert.checkOut,
    guests: alert.guests,
  };
}

export function AvailabilityAlertCard({
  alert,
  pending,
  onEdit,
  onToggle,
  onDelete,
  onCreateNew,
}: {
  alert: AlertRecord;
  pending: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onCreateNew: () => void;
}) {
  const statusLabel =
    alert.status === "ACTIVE"
      ? "Active"
      : alert.status === "PAUSED"
        ? "Paused"
        : "Expired";
  const hostelId = alert.criteria.hostelId;

  return (
    <li className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgb(15_23_42_/_4%)] sm:p-5">
      <article aria-labelledby={`alert-title-${alert.id}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              className="mt-1 mb-0 break-words text-body font-semibold"
              id={`alert-title-${alert.id}`}
            >
              {describeAvailabilityAlert(alert)}
            </h2>
            {alert.type === "HOSTEL" &&
              typeof hostelId === "string" &&
              /^[a-zA-Z0-9_-]{1,128}$/.test(hostelId) && (
                <Link
                  className="mt-1 inline-flex min-h-11 items-center text-label font-semibold text-brand underline underline-offset-2"
                  href={`/hostels/${encodeURIComponent(hostelId)}`}
                >
                  View hostel
                </Link>
              )}
          </div>
          <StatusBadge status={alert.status.toLowerCase()} tone={alert.status === "ACTIVE" ? "info" : "neutral"}>
            {statusLabel}
          </StatusBadge>
        </div>
        <p className="mb-1 mt-3 text-label text-muted">
          {dateLabel(alert.checkIn)} – {dateLabel(alert.checkOut)} · {alert.guests}{" "}
          {alert.guests === 1 ? "guest" : "guests"}
        </p>
        <p className="m-0 text-label text-muted" role="status">
          {alert.isMatched
            ? "Currently matches your availability criteria."
            : "No current match."}
        </p>

        {alert.status === "EXPIRED" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-label font-semibold disabled:opacity-60"
              disabled={pending}
              onClick={onCreateNew}
              type="button"
            >
              Create a new alert
            </button>
            <button
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-label font-semibold text-danger disabled:opacity-60"
              disabled={pending}
              onClick={onDelete}
              type="button"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-label font-semibold disabled:opacity-60"
              disabled={pending}
              onClick={onEdit}
              type="button"
            >
              Edit
            </button>
            <button
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-label font-semibold disabled:opacity-60"
              disabled={pending}
              onClick={onToggle}
              type="button"
            >
              {alert.status === "ACTIVE" ? "Pause" : "Resume"}
            </button>
            <button
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-label font-semibold text-danger disabled:opacity-60"
              disabled={pending}
              onClick={onDelete}
              type="button"
            >
              Delete
            </button>
          </div>
        )}
      </article>
    </li>
  );
}
