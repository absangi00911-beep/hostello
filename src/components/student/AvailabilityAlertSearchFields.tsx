"use client";

import { AMENITIES } from "@hostello/shared";
import type { AvailabilityAlertFormValues } from "@/components/student/availability-alert-form-model";

type Props = {
  values: AvailabilityAlertFormValues;
  update: <K extends keyof AvailabilityAlertFormValues>(
    key: K,
    value: AvailabilityAlertFormValues[K],
  ) => void;
};

export function AvailabilityAlertSearchFields({ values, update }: Props) {
  return (
    <fieldset className="grid gap-4 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold text-ink">
        Search filters
      </legend>
      <label className="grid gap-1 text-sm font-medium">
        Keywords
        <input
          className="min-h-11 rounded-lg border border-line px-3 font-normal"
          maxLength={200}
          onChange={(event) => update("q", event.target.value)}
          type="search"
          value={values.q}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        City
        <input
          className="min-h-11 rounded-lg border border-line px-3 font-normal"
          maxLength={100}
          onChange={(event) => update("city", event.target.value)}
          value={values.city}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Gender preference
        <select
          className="min-h-11 rounded-lg border border-line bg-white px-3 font-normal"
          onChange={(event) =>
            update("gender", event.target.value as AvailabilityAlertFormValues["gender"])
          }
          value={values.gender}
        >
          <option value="">All genders</option>
          <option value="MALE">Men</option>
          <option value="FEMALE">Women</option>
          <option value="MIXED">Mixed</option>
        </select>
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Minimum monthly rent (PKR)
          <input
            className="min-h-11 rounded-lg border border-line px-3 font-normal"
            min={0}
            onChange={(event) => update("minPrice", event.target.value)}
            type="number"
            value={values.minPrice}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Maximum monthly rent (PKR)
          <input
            className="min-h-11 rounded-lg border border-line px-3 font-normal"
            min={0}
            onChange={(event) => update("maxPrice", event.target.value)}
            type="number"
            value={values.maxPrice}
          />
        </label>
      </div>
      <fieldset className="grid gap-2 border-0 p-0">
        <legend className="mb-1 text-sm font-semibold text-ink">
          Amenities
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AMENITIES.map((amenity) => (
            <label
              className="flex min-h-11 items-center gap-2 text-sm"
              key={amenity.id}
            >
              <input
                checked={values.amenities.includes(amenity.id)}
                onChange={(event) =>
                  update(
                    "amenities",
                    event.target.checked
                      ? [...values.amenities, amenity.id]
                      : values.amenities.filter((item) => item !== amenity.id),
                  )
                }
                type="checkbox"
              />
              {amenity.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          checked={values.verified}
          onChange={(event) => update("verified", event.target.checked)}
          type="checkbox"
        />
        Verified listings only
      </label>
      <fieldset className="grid gap-3 border-0 p-0">
        <legend className="text-sm font-semibold text-ink">
          Nearby location (optional)
        </legend>
        <p className="m-0 text-xs text-muted">
          Coordinates are used only when you enter both values.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            Latitude
            <input
              className="min-h-11 rounded-lg border border-line px-3 font-normal"
              max={90}
              min={-90}
              onChange={(event) => update("latitude", event.target.value)}
              step="any"
              type="number"
              value={values.latitude}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Longitude
            <input
              className="min-h-11 rounded-lg border border-line px-3 font-normal"
              max={180}
              min={-180}
              onChange={(event) => update("longitude", event.target.value)}
              step="any"
              type="number"
              value={values.longitude}
            />
          </label>
        </div>
      </fieldset>
    </fieldset>
  );
}
