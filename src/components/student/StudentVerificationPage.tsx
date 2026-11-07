"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

export type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

const MAX_FILE_BYTES = 4_000_000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseVerificationStatus(value: unknown): VerificationStatus | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const status = value.data.verificationStatus;
  return status === "NONE" ||
    status === "PENDING" ||
    status === "APPROVED" ||
    status === "REJECTED"
    ? status
    : null;
}

export function validateVerificationFile(
  file: Pick<File, "size" | "type"> | null,
): string | null {
  if (!file) return "Choose a document to upload.";
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Upload a JPEG, PNG, WebP, or PDF document.";
  }
  if (file.size <= 0) return "That file is empty.";
  if (file.size > MAX_FILE_BYTES) return "File too large. Maximum size is 4MB.";
  return null;
}

function readApiError(value: unknown): string | null {
  return isRecord(value) && typeof value.error === "string" ? value.error : null;
}

const buttonClassName =
  "inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand px-5 text-[0.95rem] font-[650] text-white no-underline enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70";

export function StudentVerificationPage() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/profile", { signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(readApiError(payload) ?? "Could not load your verification status.");
        }
        const parsed = parseVerificationStatus(payload);
        if (!parsed) throw new Error("Could not load your verification status.");
        setStatus(parsed);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load your verification status.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const fileError = validateVerificationFile(file);
    if (fileError || !file) {
      setErrorMessage(fileError);
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const uploadResponse = await fetch("/api/user/verify-student/upload", {
        method: "POST",
        body: form,
      });
      const uploadPayload: unknown = await uploadResponse.json().catch(() => null);
      if (
        !uploadResponse.ok ||
        !isRecord(uploadPayload) ||
        typeof uploadPayload.key !== "string"
      ) {
        throw new Error(readApiError(uploadPayload) ?? "The upload failed. Please try again.");
      }

      const submitResponse = await fetch("/api/user/verify-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docKey: uploadPayload.key }),
      });
      const submitPayload: unknown = await submitResponse.json().catch(() => null);
      if (!submitResponse.ok) {
        throw new Error(
          readApiError(submitPayload) ?? "Your document could not be submitted.",
        );
      }

      setFile(null);
      setStatus("PENDING");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Your document could not be submitted.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-28 pt-8">
      <Link className="text-[0.9rem] font-semibold text-brand hover:underline" href="/profile">
        ← Back to profile
      </Link>
      <h1 className="mb-1 mt-3 text-[1.75rem] font-bold text-ink">
        Student verification
      </h1>
      <p className="mb-6 mt-0 text-muted">
        Upload a student ID or enrollment document. Only the HostelLo review
        team can view it.
      </p>

      {isLoading ? (
        <p className="text-muted">Loading verification status...</p>
      ) : loadError || !status ? (
        <p className="rounded-[14px] bg-surface-muted p-4 text-danger" role="alert">
          {loadError ?? "Could not load your verification status."}
        </p>
      ) : status === "APPROVED" ? (
        <p
          className="rounded-[14px] bg-brand-soft p-4 text-brand-dark"
          role="status"
        >
          You're verified. A verified student badge shows on your profile.
        </p>
      ) : status === "PENDING" ? (
        <p
          className="rounded-[14px] bg-brand-soft p-4 text-brand-dark"
          role="status"
        >
          Your document is under review. We'll notify you once it's decided.
        </p>
      ) : (
        <>
          {status === "REJECTED" ? (
            <p
              className="mb-4 rounded-[14px] bg-surface-muted p-4 text-ink"
              role="status"
            >
              Your last document wasn't approved. You can upload a clearer or
              different document below.
            </p>
          ) : null}
          {errorMessage ? (
            <p
              className="mb-4 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-danger"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
            <label className="grid gap-2 text-[0.875rem] font-semibold text-ink">
              <span>Document (JPEG, PNG, WebP or PDF, up to 4MB)</span>
              <input
                accept={ACCEPTED_TYPES.join(",")}
                className="text-base font-normal"
                name="file"
                onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
                type="file"
              />
            </label>
            <button
              className={`${buttonClassName} justify-self-start`}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
