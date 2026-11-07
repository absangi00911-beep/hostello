"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { secondaryButtonClassName } from "./ListingFormFields";

type ActionableStatus = "ACTIVE" | "DRAFT";

/** Transitions owners may request, mirroring OWNER_ALLOWED_TRANSITIONS in the hostel PATCH route. */
export function getStatusAction(
  status: string,
): { next: "DRAFT" | "PENDING_REVIEW"; label: string; help: string } | null {
  switch (status as ActionableStatus) {
    case "ACTIVE":
      return {
        next: "DRAFT",
        label: "Unpublish listing",
        help: "Moves the listing back to draft and hides it from students. New bookings stop until you submit it again.",
      };
    case "DRAFT":
      return {
        next: "PENDING_REVIEW",
        label: "Submit for review",
        help: "Sends this draft to our team. It goes live once approved.",
      };
    default:
      return null;
  }
}

export function ListingStatusActions({
  hostelId,
  status,
}: {
  hostelId: string;
  status: string;
}) {
  const router = useRouter();
  const action = getStatusAction(status);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!action) return null;

  async function run(next: string) {
    setError(null);
    setIsWorking(true);
    try {
      const response = await fetch(`/api/hostels/${encodeURIComponent(hostelId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          typeof payload === "object" &&
            payload !== null &&
            typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "We couldn't update the listing. Please try again.",
        );
        return;
      }
      router.push("/owner");
      router.refresh();
    } catch {
      setError("We couldn't update the listing. Please try again.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section
      aria-label="Listing status"
      className="mb-6 grid gap-2 rounded-[14px] border border-line bg-surface p-4"
    >
      <p className="m-0 text-[0.88rem] text-muted">{action.help}</p>
      {error ? (
        <p className="m-0 text-[0.85rem] text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <button
          className={secondaryButtonClassName}
          disabled={isWorking}
          onClick={() => void run(action.next)}
          type="button"
        >
          {isWorking ? "Working…" : action.label}
        </button>
      </div>
    </section>
  );
}
