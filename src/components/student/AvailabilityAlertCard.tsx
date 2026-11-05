"use client";

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
    <li className="rounded-xl border border-line bg-white p-4 sm:p-5">
      <article aria-labelledby={`alert-title-${alert.id}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-brand">
              {alert.type === "HOSTEL" ? "Specific hostel" : "Saved search"}
            </p>
            <h2
              className="mt-1 mb-0 break-words text-base font-semibold"
              id={`alert-title-${alert.id}`}
            >
              {describeAvailabilityAlert(alert)}
            </h2>
            {alert.type === "HOSTEL" &&
              typeof hostelId === "string" &&
              /^[a-zA-Z0-9_-]{1,128}$/.test(hostelId) && (
                <Link
                  className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-brand underline underline-offset-2"
                  href={`/hostels/${encodeURIComponent(hostelId)}`}
                >
                  View hostel
                </Link>
              )}
          </div>
          <span className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-xs font-semibold">
            {statusLabel}
          </span>
        </div>
        <p className="mb-1 mt-3 text-sm text-muted">
          {dateLabel(alert.checkIn)} – {dateLabel(alert.checkOut)} · {alert.guests}{" "}
          {alert.guests === 1 ? "guest" : "guests"}
        </p>
        <p className="m-0 text-sm text-muted" role="status">
          {alert.isMatched
            ? "Currently matches your availability criteria."
            : "No current match."}
        </p>

        {alert.status === "EXPIRED" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold disabled:opacity-60"
              disabled={pending}
              onClick={onCreateNew}
              type="button"
            >
              Create a new alert
            </button>
            <button
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold text-[#8b2525] disabled:opacity-60"
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
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold disabled:opacity-60"
              disabled={pending}
              onClick={onEdit}
              type="button"
            >
              Edit
            </button>
            <button
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold disabled:opacity-60"
              disabled={pending}
              onClick={onToggle}
              type="button"
            >
              {alert.status === "ACTIVE" ? "Pause" : "Resume"}
            </button>
            <button
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold text-[#8b2525] disabled:opacity-60"
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
