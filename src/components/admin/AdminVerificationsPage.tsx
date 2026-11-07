"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FormSection,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/owner/ListingFormFields";
import { AdminUncertainActionNotice } from "./AdminUncertainActionNotice";
import { isUncertainAdminActionStatus } from "./adminActionState";
import { readAdminError } from "./adminListings";
import {
  ADMIN_VERIFICATION_TABS,
  buildVerificationDecisionBody,
  isImageContentType,
  parseAdminVerificationsPage,
  verificationDecisionMessage,
  type AdminVerification,
  type AdminVerificationStatus,
  type VerificationDecision,
} from "./adminVerifications";

const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Karachi",
});

const dangerButtonClassName =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-danger px-4 text-[0.85rem] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),inset_0_-2px_0_rgb(0_0_0/0.18),0_2px_3px_rgb(15_23_42/0.22)] transition-[background-color,box-shadow,translate] duration-150 hover:bg-[#a52c10] active:translate-y-px active:bg-[#8f240d] active:shadow-[inset_0_3px_6px_rgb(0_0_0/0.3)] disabled:cursor-wait disabled:opacity-60 disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline-2! focus-visible:outline-brand!";

export interface DecisionResult {
  /** Error to show on the card; null when the decision went through. */
  error: string | null;
  uncertain?: boolean;
}

export type DecideAction = (
  student: AdminVerification,
  action: VerificationDecision,
) => Promise<DecisionResult>;

export function DocumentPreview({ student }: { student: AdminVerification }) {
  if (!student.documentUrl) {
    return (
      <p className="m-0 rounded-[12px] bg-surface-muted p-4 text-[0.88rem] text-muted">
        No document is available for this request. Reject it so the student can
        submit a new one.
      </p>
    );
  }

  if (isImageContentType(student.documentContentType)) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] border border-line bg-surface-muted">
        <Image
          alt={`Verification document submitted by ${student.name}`}
          className="object-contain"
          fill
          sizes="(min-width: 768px) 720px, 100vw"
          src={student.documentUrl}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="grid gap-2 rounded-[12px] border border-line p-4">
      <p className="m-0 text-[0.88rem] text-ink">
        This document is a PDF and cannot be previewed here.
      </p>
      <a
        className={`${secondaryButtonClassName} w-fit`}
        href={student.documentUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Download PDF
      </a>
    </div>
  );
}

export function DecisionForm({
  mode,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  mode: VerificationDecision;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-[12px] bg-surface-muted p-4">
      <p className="m-0 text-[0.9rem] text-ink">
        {mode === "approve"
          ? "Approve this student? They are marked as a verified student and notified. The uploaded document is deleted."
          : "Reject this verification? The student is notified and can submit a new document. The uploaded document is deleted."}
      </p>
      {error ? (
        <p className="m-0 text-[0.875rem] text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          className={
            mode === "reject" ? dangerButtonClassName : primaryButtonClassName
          }
          disabled={busy}
          onClick={onConfirm}
          type="button"
        >
          {busy
            ? "Working…"
            : mode === "approve"
              ? "Approve student"
              : "Reject verification"}
        </button>
        <button
          className={secondaryButtonClassName}
          disabled={busy}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function VerificationCard({
  student,
  status,
  onDecide,
}: {
  student: AdminVerification;
  status: AdminVerificationStatus;
  onDecide: DecideAction;
}) {
  const [showDocument, setShowDocument] = useState(false);
  const [panel, setPanel] = useState<VerificationDecision | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);

  const isPending = status === "PENDING";
  // Approving without having a document to look at would be a blind decision.
  const canApprove = Boolean(student.documentUrl);

  async function confirm(action: VerificationDecision) {
    setBusy(true);
    setError(null);
    const result = await onDecide(student, action);
    // On success the parent removes this card, so only failures need state.
    setBusy(false);
    if (result.error) {
      setError(result.error);
      setUncertain(result.uncertain === true);
      if (result.uncertain) setShowDocument(false);
    }
  }

  return (
    <li className="grid gap-3 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-[1.02rem] font-semibold text-ink">
          {student.name}
        </h3>
        <span className="rounded-full bg-surface-muted px-[10px] py-[2px] text-[0.72rem] font-bold text-muted">
          {student.bookingCount}{" "}
          {student.bookingCount === 1 ? "booking" : "bookings"}
        </span>
      </div>
      <p className="m-0 text-[0.85rem] text-muted">
        {student.email}
        {student.city ? ` · ${student.city}` : ""}
        {student.submittedAt
          ? ` · submitted ${dateFormatter.format(new Date(student.submittedAt))}`
          : ""}
      </p>

      {isPending ? (
        <>
          {uncertain ? (
            <AdminUncertainActionNotice />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  aria-expanded={showDocument}
                  className={secondaryButtonClassName}
                  onClick={() => setShowDocument((open) => !open)}
                  type="button"
                >
                  {showDocument ? "Hide document" : "Review document"}
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={!canApprove}
                  onClick={() => setPanel(panel === "approve" ? null : "approve")}
                  type="button"
                >
                  Approve
                </button>
                <button
                  className={secondaryButtonClassName}
                  onClick={() => setPanel(panel === "reject" ? null : "reject")}
                  type="button"
                >
                  Reject
                </button>
              </div>

              {showDocument ? <DocumentPreview student={student} /> : null}
            </>
          )}

          {panel && !uncertain ? (
            <DecisionForm
              busy={busy}
              error={error}
              mode={panel}
              onCancel={() => {
                setPanel(null);
                setError(null);
              }}
              onConfirm={() => void confirm(panel)}
            />
          ) : null}
        </>
      ) : (
        <p className="m-0 text-[0.82rem] text-muted">
          Documents are deleted once a decision is made, so there is nothing
          left to review.
        </p>
      )}
    </li>
  );
}

export interface AdminVerificationsContentProps {
  status: AdminVerificationStatus;
  searchInput: string;
  students: AdminVerification[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  notice: { tone: "success" | "error"; text: string } | null;
  onStatusChange: (status: AdminVerificationStatus) => void;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onDecide: DecideAction;
}

export function AdminVerificationsContent({
  status,
  searchInput,
  students,
  total,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  moreError,
  notice,
  onStatusChange,
  onSearchInputChange,
  onSearch,
  onRetry,
  onLoadMore,
  onDecide,
}: AdminVerificationsContentProps) {
  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/admin"
      >
        ← Back to admin console
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Student verification
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Check student documents. The oldest submissions come first.
      </p>

      <div className="grid gap-5">
        <div
          aria-label="Verification status"
          className="flex flex-wrap gap-2"
          role="group"
        >
          {ADMIN_VERIFICATION_TABS.map((tab) => (
            <button
              aria-pressed={status === tab.value}
              className={`${secondaryButtonClassName} ${status === tab.value ? "border-brand! bg-brand-soft! text-brand-dark!" : ""}`}
              key={tab.value}
              onClick={() => onStatusChange(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
          role="search"
        >
          <input
            aria-label="Search students by name or email"
            className={fieldClassName}
            maxLength={100}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search by name or email"
            type="search"
            value={searchInput}
          />
          <button className={secondaryButtonClassName} type="submit">
            Search
          </button>
        </form>

        {notice ? (
          <p
            className={`m-0 rounded-[14px] px-[13px] py-[11px] text-[0.875rem] ${notice.tone === "success" ? "bg-brand-soft text-brand-dark" : "bg-surface-muted text-danger"}`}
            role={notice.tone === "success" ? "status" : "alert"}
          >
            {notice.text}
          </p>
        ) : null}

        <FormSection title="Students">
          {isLoading ? (
            <p className="m-0 text-muted" role="status">
              Loading verification requests...
            </p>
          ) : loadError ? (
            <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
              <p className="m-0 text-danger">{loadError}</p>
              <button
                className={`${secondaryButtonClassName} mt-3`}
                onClick={onRetry}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : students.length === 0 ? (
            <p className="m-0 text-[0.92rem] text-muted">
              {status === "PENDING"
                ? "No verification requests are waiting."
                : "No students match."}
            </p>
          ) : (
            <>
              <p aria-live="polite" className="m-0 text-[0.85rem] text-muted">
                {total} {total === 1 ? "student" : "students"}
              </p>
              <ul className="m-0 grid list-none gap-3 p-0">
                {students.map((student) => (
                  <VerificationCard
                    key={student.id}
                    onDecide={onDecide}
                    status={status}
                    student={student}
                  />
                ))}
              </ul>
            </>
          )}
          {moreError ? (
            <p
              className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-danger"
              role="alert"
            >
              {moreError}
            </p>
          ) : null}
          {hasMore ? (
            <div className="text-center">
              <button
                className={secondaryButtonClassName}
                disabled={isLoadingMore}
                onClick={onLoadMore}
                type="button"
              >
                {isLoadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </FormSection>
      </div>
    </main>
  );
}

async function fetchVerifications(
  status: AdminVerificationStatus,
  search: string,
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    status,
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (search) params.set("search", search);
  const response = await fetch(`/api/admin/verifications?${params.toString()}`, {
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      readAdminError(payload, "Could not load verification requests."),
    );
  }
  const parsed = parseAdminVerificationsPage(payload);
  if (!parsed) throw new Error("Could not load verification requests.");
  return parsed;
}

export function AdminVerificationsPage() {
  const [status, setStatus] = useState<AdminVerificationStatus>("PENDING");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<AdminVerification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [notice, setNotice] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    setMoreError(null);
    fetchVerifications(status, search, 1, controller.signal)
      .then((result) => {
        setStudents(result.data);
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load verification requests.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [status, search, retryCount]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const result = await fetchVerifications(status, search, page + 1);
      setStudents((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error
          ? error.message
          : "Could not load more verification requests.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [status, search, page]);

  const decide = useCallback<DecideAction>(async (student, action) => {
    try {
      const response = await fetch("/api/admin/verifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildVerificationDecisionBody(student.id, action)),
      });
      if (response.ok) {
        // The request is no longer pending, so it leaves this queue.
        setStudents((current) => current.filter((item) => item.id !== student.id));
        setTotal((current) => Math.max(0, current - 1));
        setNotice({
          tone: "success",
          text: verificationDecisionMessage(action, student.name),
        });
        return { error: null };
      }
      const payload: unknown = await response.json().catch(() => null);
      const message = readAdminError(
        payload,
        "We couldn't save this decision. Please try again.",
      );
      if (response.status === 409) {
        // Another admin already decided; show the fresh queue.
        setNotice({ tone: "error", text: message });
        setRetryCount((count) => count + 1);
      }
      return {
        error: message,
        uncertain: isUncertainAdminActionStatus(response.status),
      };
    } catch {
      return {
        error: "We couldn't save this decision. Please try again.",
        uncertain: true,
      };
    }
  }, []);

  return (
    <AdminVerificationsContent
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      loadError={loadError}
      moreError={moreError}
      notice={notice}
      onDecide={decide}
      onLoadMore={() => void loadMore()}
      onRetry={() => setRetryCount((count) => count + 1)}
      onSearch={() => {
        setNotice(null);
        setSearch(searchInput.trim());
      }}
      onSearchInputChange={setSearchInput}
      onStatusChange={(next) => {
        setNotice(null);
        setStatus(next);
      }}
      searchInput={searchInput}
      status={status}
      students={students}
      total={total}
    />
  );
}
