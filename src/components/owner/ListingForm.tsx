"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CANCELLATION_POLICY_DETAILS } from "@/lib/cancellation-policy";
import {
  AMENITY_OPTIONS,
  CANCELLATION_POLICIES,
  CITY_OPTIONS,
  LISTING_LIMITS,
  buildListingPayload,
  emptyListingForm,
  listingToFormValues,
  readServerFieldErrors,
  validateListingForm,
  type ListingFormErrors,
  type ListingFormValues,
  type StoredListing,
} from "./listing-form";
import {
  Field,
  FormSection,
  controlProps,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "./ListingFormFields";
import { ListingPhotosField } from "./ListingPhotosField";
import { ListingRoomsEditor } from "./ListingRoomsEditor";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Boys" },
  { value: "FEMALE", label: "Girls" },
  { value: "MIXED", label: "Mixed" },
] as const;

const AMENITY_CATEGORIES: ReadonlyArray<{
  id: (typeof AMENITY_OPTIONS)[number]["category"];
  label: string;
}> = [
  { id: "connectivity", label: "Connectivity" },
  { id: "meals", label: "Meals" },
  { id: "facilities", label: "Facilities" },
  { id: "safety", label: "Safety" },
  { id: "comfort", label: "Comfort" },
];

function readErrorMessage(payload: unknown, fallback: string): string {
  return typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { error?: unknown }).error === "string"
    ? (payload as { error: string }).error
    : fallback;
}

export function ListingSubmitted({
  onAddAnother,
  updated = false,
}: {
  onAddAnother?: () => void;
  updated?: boolean;
}) {
  return (
    <div
      className="grid gap-4 rounded-[16px] border border-line bg-surface p-6"
      role="status"
    >
      <h2 className="m-0 text-[1.3rem] font-semibold text-ink">
        {updated ? "Changes saved and submitted for review" : "Listing submitted for review"}
      </h2>
      <p className="m-0 text-[0.95rem] text-muted">
        {updated
          ? "Your listing is pending review again and isn't visible to students until it is approved. We'll notify you once it has been reviewed."
          : "Your listing is pending review and isn't visible to students yet. We'll notify you once it has been reviewed."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link className={primaryButtonClassName} href="/owner">
          Back to dashboard
        </Link>
        {onAddAnother ? (
          <button
            className={secondaryButtonClassName}
            onClick={onAddAnother}
            type="button"
          >
            Add another listing
          </button>
        ) : null}
      </div>
    </div>
  );
}

export interface ListingFormProps {
  /** Present when editing: the stored listing and its id. Absent when creating. */
  existing?: { id: string; listing: StoredListing };
}

export function ListingForm({ existing }: ListingFormProps = {}) {
  const isEdit = existing !== undefined;
  const [values, setValues] = useState<ListingFormValues>(() =>
    existing ? listingToFormValues(existing.listing) : emptyListingForm(),
  );
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverDetails, setServerDetails] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [summaryVersion, setSummaryVersion] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (summaryVersion > 0) summaryRef.current?.focus();
  }, [summaryVersion]);

  function set<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleAmenity(id: string) {
    setValues((current) => ({
      ...current,
      amenities: current.amenities.includes(id)
        ? current.amenities.filter((entry) => entry !== id)
        : [...current.amenities, id],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setServerDetails([]);

    const found = validateListingForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSummaryVersion((version) => version + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        existing ? `/api/hostels/${encodeURIComponent(existing.id)}` : "/api/hostels",
        {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildListingPayload(values)),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setServerError(
          readErrorMessage(
            payload,
            isEdit
              ? "We couldn't save your changes. Please try again."
              : "We couldn't submit your listing. Please try again.",
          ),
        );
        setServerDetails(readServerFieldErrors(payload));
        setSummaryVersion((version) => version + 1);
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError(
        isEdit
          ? "We couldn't save your changes. Please try again."
          : "We couldn't submit your listing. Please try again.",
      );
      setSummaryVersion((version) => version + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted && isEdit) {
    return <ListingSubmitted updated />;
  }

  if (submitted) {
    return (
      <ListingSubmitted
        onAddAnother={() => {
          setValues(emptyListingForm());
          setErrors({});
          setSubmitted(false);
        }}
      />
    );
  }

  const errorMessages = Object.values(errors);
  const hasSummary = errorMessages.length > 0 || serverError !== null;

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
      {hasSummary ? (
        <div
          className="rounded-[14px] bg-surface-muted p-4 text-[0.9rem] text-[#c13515] outline-none"
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
        >
          <p className="m-0 font-semibold">
            {serverError ??
              (isEdit
                ? "Please fix the following before saving:"
                : "Please fix the following before submitting:")}
          </p>
          {serverDetails.length > 0 ? (
            <ul className="mb-0 mt-2 pl-5">
              {serverDetails.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
          {!serverError ? (
            <ul className="mb-0 mt-2 pl-5">
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <FormSection title="Basics">
        <Field error={errors.name} id="listing-name" label="Hostel name">
          <input
            {...controlProps("listing-name", errors.name)}
            className={fieldClassName}
            maxLength={LISTING_LIMITS.nameMax}
            onChange={(event) => set("name", event.currentTarget.value)}
            type="text"
            value={values.name}
          />
        </Field>
        <Field
          error={errors.description}
          hint={`At least ${LISTING_LIMITS.descriptionMin} characters. Describe the building, surroundings and what students can expect.`}
          id="listing-description"
          label="Description"
        >
          <textarea
            {...controlProps(
              "listing-description",
              errors.description,
              `At least ${LISTING_LIMITS.descriptionMin} characters. Describe the building, surroundings and what students can expect.`,
            )}
            className={`${fieldClassName} min-h-[140px] resize-y`}
            maxLength={LISTING_LIMITS.descriptionMax}
            onChange={(event) => set("description", event.currentTarget.value)}
            value={values.description}
          />
        </Field>
        <fieldset className="m-0 grid gap-2 border-0 p-0" aria-describedby={errors.gender ? "listing-gender-error" : undefined}>
          <legend className="mb-1 p-0 text-[0.875rem] font-semibold text-ink">
            Who is it for?
          </legend>
          <div className="flex flex-wrap gap-4">
            {GENDER_OPTIONS.map(({ value, label }) => (
              <label className="inline-flex items-center gap-2 text-[0.92rem] text-ink" key={value}>
                <input
                  checked={values.gender === value}
                  name="gender"
                  onChange={() => set("gender", value)}
                  type="radio"
                  value={value}
                />
                {label}
              </label>
            ))}
          </div>
          {errors.gender ? (
            <p className="m-0 text-[0.82rem] text-[#c13515]" id="listing-gender-error">
              {errors.gender}
            </p>
          ) : null}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.city} id="listing-city" label="City">
            <select
              {...controlProps("listing-city", errors.city)}
              className={fieldClassName}
              onChange={(event) => set("city", event.currentTarget.value)}
              value={values.city}
            >
              <option value="">Select a city</option>
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </Field>
          <Field id="listing-area" label="Area (optional)">
            <input
              {...controlProps("listing-area")}
              className={fieldClassName}
              onChange={(event) => set("area", event.currentTarget.value)}
              type="text"
              value={values.area}
            />
          </Field>
        </div>
        <Field error={errors.address} id="listing-address" label="Full address">
          <input
            {...controlProps("listing-address", errors.address)}
            autoComplete="street-address"
            className={fieldClassName}
            onChange={(event) => set("address", event.currentTarget.value)}
            type="text"
            value={values.address}
          />
        </Field>
      </FormSection>

      <FormSection
        description="Add each kind of room students can book. The listing price shown to students is your lowest room price."
        title="Rooms"
      >
        <ListingRoomsEditor
          errors={errors}
          onChange={(rooms) => set("rooms", rooms)}
          rooms={values.rooms}
        />
      </FormSection>

      <FormSection title="Amenities">
        <fieldset
          aria-describedby={errors.amenities ? "listing-amenities-error" : undefined}
          className="m-0 grid gap-4 border-0 p-0"
        >
          <legend className="sr-only">Amenities</legend>
          {AMENITY_CATEGORIES.map((category) => (
            <div className="grid gap-2" key={category.id}>
              <p className="m-0 text-[0.8rem] font-semibold uppercase tracking-wide text-muted">
                {category.label}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {AMENITY_OPTIONS.filter((amenity) => amenity.category === category.id).map(
                  (amenity) => (
                    <label
                      className="inline-flex items-center gap-2 text-[0.92rem] text-ink"
                      key={amenity.id}
                    >
                      <input
                        checked={values.amenities.includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                        type="checkbox"
                        value={amenity.id}
                      />
                      {amenity.label}
                    </label>
                  ),
                )}
              </div>
            </div>
          ))}
          {errors.amenities ? (
            <p className="m-0 text-[0.82rem] text-[#c13515]" id="listing-amenities-error">
              {errors.amenities}
            </p>
          ) : null}
        </fieldset>
      </FormSection>

      <FormSection
        description="Photos help students decide. The first photo is used as the cover."
        title="Photos"
      >
        <ListingPhotosField
          error={errors.images}
          images={values.images}
          onChange={(images) => set("images", images)}
        />
      </FormSection>

      <FormSection title="Stay length and house rules">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.minStay} id="listing-min-stay" label="Minimum stay (months)">
            <input
              {...controlProps("listing-min-stay", errors.minStay)}
              className={fieldClassName}
              inputMode="numeric"
              onChange={(event) => set("minStay", event.currentTarget.value)}
              type="text"
              value={values.minStay}
            />
          </Field>
          <Field
            error={errors.maxStay}
            id="listing-max-stay"
            label="Maximum stay (months, optional)"
          >
            <input
              {...controlProps("listing-max-stay", errors.maxStay)}
              className={fieldClassName}
              inputMode="numeric"
              onChange={(event) => set("maxStay", event.currentTarget.value)}
              type="text"
              value={values.maxStay}
            />
          </Field>
        </div>
        <Field
          error={errors.rules}
          hint="One rule per line, e.g. No smoking indoors"
          id="listing-rules"
          label="House rules (optional)"
        >
          <textarea
            {...controlProps("listing-rules", errors.rules, "One rule per line, e.g. No smoking indoors")}
            className={`${fieldClassName} min-h-[100px] resize-y`}
            onChange={(event) => set("rules", event.currentTarget.value)}
            value={values.rules}
          />
        </Field>
      </FormSection>

      <FormSection
        description="Students see these terms before they book, and refunds follow them."
        title="Cancellation policy"
      >
        <fieldset
          aria-describedby={errors.cancellationPolicy ? "listing-policy-error" : undefined}
          className="m-0 grid gap-3 border-0 p-0"
        >
          <legend className="sr-only">Cancellation policy</legend>
          {CANCELLATION_POLICIES.map((policy) => {
            const details = CANCELLATION_POLICY_DETAILS[policy];
            return (
              <label
                className="flex cursor-pointer gap-3 rounded-[12px] border border-line p-4 has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
                key={policy}
              >
                <input
                  checked={values.cancellationPolicy === policy}
                  className="mt-1"
                  name="cancellationPolicy"
                  onChange={() => set("cancellationPolicy", policy)}
                  type="radio"
                  value={policy}
                />
                <span className="grid gap-1 text-[0.85rem] text-muted">
                  <span className="text-[0.95rem] font-semibold text-ink">{details.label}</span>
                  <span>{details.fullRefund}</span>
                  <span>{details.partialRefund}</span>
                  <span>{details.noRefund}</span>
                </span>
              </label>
            );
          })}
          {errors.cancellationPolicy ? (
            <p className="m-0 text-[0.82rem] text-[#c13515]" id="listing-policy-error">
              {errors.cancellationPolicy}
            </p>
          ) : null}
        </fieldset>
      </FormSection>

      <div className="flex flex-wrap items-center gap-4">
        <button className={primaryButtonClassName} disabled={isSubmitting} type="submit">
          {isSubmitting
            ? isEdit
              ? "Saving…"
              : "Submitting…"
            : isEdit
              ? "Save and submit for review"
              : "Submit for review"}
        </button>
        <Link className="text-[0.9rem] font-semibold text-brand hover:underline" href="/owner">
          Cancel
        </Link>
      </div>
      <p className="m-0 text-[0.82rem] text-muted">
        {isEdit
          ? "Saving changes sends the listing back to review. It stays hidden from students until it is approved again."
          : "New listings are reviewed before they become visible to students."}
      </p>
    </form>
  );
}
