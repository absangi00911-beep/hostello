"use client";

import { useState, type FormEvent } from "react";

const subRatings = [
  ["cleanliness", "Cleanliness"],
  ["location", "Location"],
  ["value", "Value"],
  ["safety", "Safety"],
] as const;

type SubRatingKey = (typeof subRatings)[number][0];

export function validateReview(input: {
  rating: number;
  comment: string;
}): string | null {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return "Choose an overall rating from 1 to 5.";
  }
  if (input.comment.trim().length < 20) {
    return "Write at least 20 characters about your stay.";
  }
  if (input.comment.trim().length > 1000) {
    return "Keep your review under 1,000 characters.";
  }
  return null;
}

function readFirstFieldError(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const details = (payload as { details?: unknown }).details;
  if (typeof details !== "object" || details === null) return null;
  const fieldErrors = (details as { fieldErrors?: unknown }).fieldErrors;
  if (typeof fieldErrors !== "object" || fieldErrors === null) return null;
  for (const messages of Object.values(fieldErrors)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") {
      return messages[0];
    }
  }
  return null;
}

function readApiError(payload: unknown): string | null {
  return typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { error?: unknown }).error === "string"
    ? (payload as { error: string }).error
    : null;
}

const inputClassName =
  "min-h-[44px] w-full rounded-[8px] border border-muted bg-white px-3 text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!";

export function BookingReviewForm({
  hostelId,
  hostelName,
}: {
  hostelId: string;
  hostelName: string;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [details, setDetails] = useState<Record<SubRatingKey, number>>({
    cleanliness: 0,
    location: 0,
    value: 0,
    safety: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const validationError = validateReview({ rating, comment });
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostelId,
          rating,
          ...(title.trim() ? { title: title.trim() } : {}),
          comment: comment.trim(),
          ...details,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(
          readFirstFieldError(payload) ??
            readApiError(payload) ??
            "We couldn't submit your review. Please try again.",
        );
        return;
      }
      setSubmitted(true);
    } catch {
      setErrorMessage("We couldn't submit your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section
        aria-label="Review"
        className="mt-5 rounded-[14px] border border-line bg-surface p-5"
      >
        <p className="m-0 text-brand-dark" role="status">
          Thanks, your review of {hostelName} was submitted.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Review this stay"
      className="mt-5 rounded-[14px] border border-line bg-surface p-5"
    >
      <h2 className="m-0 mb-1 text-[1.05rem] font-semibold text-ink">
        Review your stay
      </h2>
      <p className="mb-4 mt-0 text-[0.9rem] text-muted">
        Help other students by sharing how {hostelName} was. Submitting again
        updates your earlier review.
      </p>

      {errorMessage ? (
        <p
          className="mb-4 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-danger"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 p-0 text-[0.875rem] font-semibold text-ink">
            Overall rating
          </legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[8px] border border-line bg-white font-semibold text-ink has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-dark has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand"
                key={value}
              >
                <input
                  checked={rating === value}
                  className="sr-only"
                  name="rating"
                  onChange={() => setRating(value)}
                  type="radio"
                  value={value}
                />
                <span aria-hidden="true">{value}</span>
                <span className="sr-only">
                  {value} {value === 1 ? "star" : "stars"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {subRatings.map(([key, label]) => (
            <label
              className="grid gap-1 text-[0.8rem] font-semibold text-ink"
              key={key}
            >
              <span>{label}</span>
              <select
                className={inputClassName}
                name={key}
                onChange={(event) =>
                  setDetails((current) => ({
                    ...current,
                    [key]: Number(event.currentTarget.value),
                  }))
                }
                value={details[key]}
              >
                <option value={0}>Not rated</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <label className="grid gap-1 text-[0.875rem] font-semibold text-ink">
          <span>
            Title <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            className={inputClassName}
            maxLength={100}
            name="title"
            onChange={(event) => setTitle(event.currentTarget.value)}
            type="text"
            value={title}
          />
        </label>

        <label className="grid gap-1 text-[0.875rem] font-semibold text-ink">
          <span>Your review</span>
          <textarea
            className={`${inputClassName} min-h-[120px] py-2`}
            maxLength={1000}
            name="comment"
            onChange={(event) => setComment(event.currentTarget.value)}
            required
            value={comment}
          />
          <span className="text-[0.8rem] font-normal text-muted">
            {comment.trim().length}/1000, at least 20 characters
          </span>
        </label>

        <button
          className="inline-flex min-h-[46px] cursor-pointer items-center justify-center justify-self-start rounded-[8px] border-0 bg-brand px-5 text-[0.95rem] font-[650] text-white enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </section>
  );
}
