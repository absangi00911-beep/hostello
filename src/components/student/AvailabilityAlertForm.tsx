"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AvailabilityAlertSearchFields } from "@/components/student/AvailabilityAlertSearchFields";
import { AvailabilityAlertStayFields } from "@/components/student/AvailabilityAlertStayFields";
import {
  buildAvailabilityAlertInput,
  initialAvailabilityAlertFormValues,
  type AvailabilityAlertFormInitial,
  type AvailabilityAlertFormValues,
} from "@/components/student/availability-alert-form-model";

type Props = {
  initial?: AvailabilityAlertFormInitial;
  onCancel?: () => void;
  onSaved: (result: { isMatched: boolean }) => void;
  onUncertain: () => void;
};

function readError(result: unknown) {
  return typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof result.error === "string"
    ? result.error
    : null;
}

export function AvailabilityAlertForm({
  initial,
  onCancel,
  onSaved,
  onUncertain,
}: Props) {
  const [values, setValues] = useState(() =>
    initialAvailabilityAlertFormValues(initial),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof AvailabilityAlertFormValues>(
    key: K,
    value: AvailabilityAlertFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    let input: ReturnType<typeof buildAvailabilityAlertInput>;
    try {
      input = buildAvailabilityAlertInput(values);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Check the alert details and try again.",
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        initial?.id
          ? `/api/availability-alerts/${encodeURIComponent(initial.id)}`
          : "/api/availability-alerts",
        {
          method: initial?.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            initial?.id ? { criteria: input } : input,
          ),
        },
      );
      const result: unknown = await response.json();
      if (!response.ok) {
        if (response.status >= 500) {
          onUncertain();
          return;
        }
        setError(
          readError(result) ??
            "We couldn't confirm this change. Refresh the alert list before trying again.",
        );
        return;
      }

      const isMatched =
        typeof result === "object" &&
        result !== null &&
        "data" in result &&
        typeof result.data === "object" &&
        result.data !== null &&
        "isMatched" in result.data &&
        result.data.isMatched === true;
      onSaved({ isMatched });
    } catch {
      onUncertain();
    } finally {
      setSaving(false);
    }
  }

  const isEditing = Boolean(initial?.id);

  return (
    <form
      aria-label={isEditing ? "Edit availability alert" : "Create availability alert"}
      className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:p-5"
      onSubmit={submit}
    >
      <div>
        <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-brand">
          {isEditing ? "Edit alert" : "New alert"}
        </p>
        <h2 className="mt-1 mb-0 text-lg font-semibold text-ink">
          {values.type === "HOSTEL" ? "Specific hostel" : "Saved search"}
        </h2>
      </div>

      {values.type === "HOSTEL" ? (
        <p className="m-0 flex flex-wrap items-center gap-x-1 text-sm text-muted">
          This alert is for the hostel selected on its detail page.
          {values.hostelId && /^[a-zA-Z0-9_-]{1,128}$/.test(values.hostelId) && (
            <Link
              className="font-semibold text-brand underline underline-offset-2"
              href={`/hostels/${encodeURIComponent(values.hostelId)}`}
            >
              View selected hostel
            </Link>
          )}
        </p>
      ) : (
        <AvailabilityAlertSearchFields values={values} update={update} />
      )}

      <AvailabilityAlertStayFields values={values} update={update} />

      {error && (
        <p className="m-0 text-sm text-[#8b2525]" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg border-0 bg-brand px-5 font-semibold text-white hover:enabled:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving…" : isEditing ? "Save changes" : "Create alert"}
        </button>
        {onCancel && (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 font-semibold text-ink"
            disabled={saving}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
