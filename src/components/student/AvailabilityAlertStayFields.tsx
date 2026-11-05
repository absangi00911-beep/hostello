"use client";

import type { AvailabilityAlertFormValues } from "@/components/student/availability-alert-form-model";

type Props = {
  values: AvailabilityAlertFormValues;
  update: <K extends keyof AvailabilityAlertFormValues>(
    key: K,
    value: AvailabilityAlertFormValues[K],
  ) => void;
};

export function AvailabilityAlertStayFields({ values, update }: Props) {
  return (
    <fieldset className="grid gap-4 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold text-ink">
        Stay details
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Check-in
          <input
            className="min-h-11 rounded-lg border border-line px-3 font-normal"
            onChange={(event) => update("checkIn", event.target.value)}
            required
            type="date"
            value={values.checkIn}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Check-out
          <input
            className="min-h-11 rounded-lg border border-line px-3 font-normal"
            onChange={(event) => update("checkOut", event.target.value)}
            required
            type="date"
            value={values.checkOut}
          />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium sm:max-w-xs">
        Guests (1–4)
        <select
          className="min-h-11 rounded-lg border border-line bg-white px-3 font-normal"
          onChange={(event) => update("guests", event.target.value)}
          value={values.guests}
        >
          {[1, 2, 3, 4].map((guestCount) => (
            <option key={guestCount} value={guestCount}>
              {guestCount}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
