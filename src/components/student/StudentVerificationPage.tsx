"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AccountPageHeader } from "@/components/layout/AccountPageHeader";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { prepareImageForUpload } from "@/lib/client-image-prepare";

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
  "inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand px-5 text-body font-[650] text-white no-underline enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70";

export function StudentVerificationPage() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

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

    if (!file) {
      setErrorMessage(validateVerificationFile(null));
      return;
    }

    setIsSubmitting(true);
    try {
      // ID photos taken on a phone are usually over the limit; shrink images (not PDFs) first.
      const candidate =
        file.type === "application/pdf"
          ? file
          : await prepareImageForUpload(file, MAX_FILE_BYTES);
      const fileError = validateVerificationFile(candidate);
      if (fileError) {
        setErrorMessage(
          candidate === file && file.size > MAX_FILE_BYTES && file.type.startsWith("image/")
            ? "This photo is over 4MB and could not be resized. Try a smaller image."
            : fileError,
        );
        return;
      }

      const form = new FormData();
      form.set("file", candidate);
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
      setJustSubmitted(true);
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
    <main id="main-content" className="min-h-dvh bg-canvas pt-8 pb-28 md:py-14">
      <div className="mx-auto w-[min(calc(100%-var(--page-gutter-mobile)),640px)] md:w-[min(1040px,calc(100%-var(--page-gutter-total)))]">
        <AccountPageHeader
          title="Student verification"
          description="Upload a student ID or enrollment document. Only the HostelLo review team can view it."
          action={
            <Link
              className="inline-flex min-h-11 items-center rounded-[8px] border border-line bg-surface px-4 text-label font-semibold text-ink no-underline hover:border-line-strong hover:bg-surface-muted"
              href="/profile"
            >
              Back to profile
            </Link>
          }
        />

      {isLoading ? (
        <p className="text-muted" role="status">
          Loading verification status...
        </p>
      ) : loadError || !status ? (
        <p className="rounded-xl bg-surface-muted p-4 text-danger" role="alert">
          {loadError ?? "Could not load your verification status."}
        </p>
      ) : status === "APPROVED" ? (
        <p
          className="rounded-xl bg-brand-soft p-4 text-brand-dark"
          role="status"
        >
          You're verified. A verified student badge shows on your profile.
        </p>
      ) : status === "PENDING" ? (
        <AuthNotice focusOnMount={justSubmitted} tone="success">
          Your document is under review. We&apos;ll notify you once it&apos;s decided.
        </AuthNotice>
      ) : (
        <>
          {status === "REJECTED" ? (
            <p
              className="mb-4 rounded-xl bg-surface-muted p-4 text-ink"
              role="status"
            >
              Your last document wasn't approved. You can upload a clearer or
              different document below.
            </p>
          ) : null}
          {errorMessage ? <AuthNotice tone="error">{errorMessage}</AuthNotice> : null}
          <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
            <label className="grid gap-2 text-label font-semibold text-ink">
              <span>Document (JPEG, PNG, WebP or PDF)</span>
              <span className="text-label font-normal text-muted">
                Photos over 4MB are resized automatically. PDFs must be 4MB or smaller.
              </span>
              <input
                accept={ACCEPTED_TYPES.join(",")}
                className="w-full text-body font-normal text-ink file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-[8px] file:border file:border-control-border file:bg-white file:px-4 file:text-label file:font-semibold file:text-ink hover:file:bg-surface-muted"
                name="file"
                onChange={(event) => {
                  setFile(event.currentTarget.files?.[0] ?? null);
                  setErrorMessage(null);
                }}
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
      </div>
    </main>
  );
}
