"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  FormSection,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/owner/ListingFormFields";
import {
  ADMIN_LISTING_TABS,
  FLAGGED_THRESHOLD,
  SUSPEND_REASON_MAX,
  VERIFICATION_CHECK_LABELS,
  VERIFY_NOTES_MAX,
  allChecksDone,
  buildModerationBody,
  moderationSuccessMessage,
  parseAdminListingDetail,
  parseAdminListingsPage,
  readAdminError,
  validateSuspendReason,
  validateVerifyNotes,
  type AdminListing,
  type AdminListingDetail,
  type AdminListingStatus,
  type ModerationAction,
  type VerificationChecks,
} from "./adminListings";

const PAGE_SIZE = 20;

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeZone: "Asia/Karachi",
});

const dangerButtonClassName =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-[#c13515] px-4 text-[0.85rem] font-semibold text-white hover:bg-[#a52c10] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2! focus-visible:outline-brand!";

export interface ModerationResult {
  /** Error to show on the card; null when the change went through. */
  error: string | null;
}

export type ModerateAction = (
  listing: AdminListing,
  action: ModerationAction,
  body: ReturnType<typeof buildModerationBody>,
) => Promise<ModerationResult>;

export function ModerationForm({
  mode,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  mode: ModerationAction;
  busy: boolean;
  error: string | null;
  onSubmit: (input: {
    reason: string;
    checks: VerificationChecks;
    notes: string;
  }) => void;
  onCancel: () => void;
}) {
  const [checks, setChecks] = useState<VerificationChecks>({
    ownerAuthorityChecked: false,
    locationChecked: false,
    listingDetailsChecked: false,
    photosChecked: false,
  });
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validation =
      mode === "verify"
        ? validateVerifyNotes(notes)
        : mode === "suspend"
          ? validateSuspendReason(reason)
          : null;
    if (validation) {
      setLocalError(validation);
      return;
    }
    setLocalError(null);
    onSubmit({ reason, checks, notes });
  }

  const shownError = localError ?? error;

  return (
    <form
      className="grid gap-3 rounded-[12px] bg-surface-muted p-4"
      noValidate
      onSubmit={handleSubmit}
    >
      {mode === "verify" ? (
        <>
          <fieldset className="m-0 grid gap-2 border-0 p-0">
            <legend className="mb-1 p-0 text-[0.9rem] font-semibold text-ink">
              Confirm each check before publishing
            </legend>
            {VERIFICATION_CHECK_LABELS.map(({ key, label }) => (
              <label
                className="flex items-start gap-2 text-[0.9rem] text-ink"
                key={key}
              >
                <input
                  checked={checks[key]}
                  className="mt-1"
                  onChange={(event) =>
                    setChecks({ ...checks, [key]: event.target.checked })
                  }
                  type="checkbox"
                />
                {label}
              </label>
            ))}
          </fieldset>
          <label className="grid gap-1 text-[0.875rem] font-semibold text-ink">
            Notes (optional, internal)
            <textarea
              className={`${fieldClassName} min-h-[80px] font-normal`}
              maxLength={VERIFY_NOTES_MAX}
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </label>
          <p className="m-0 text-[0.82rem] text-muted">
            This publishes the listing with the verified badge and notifies the
            owner.
          </p>
        </>
      ) : mode === "suspend" ? (
        <>
          <label className="grid gap-1 text-[0.875rem] font-semibold text-ink">
            Reason (optional, sent to the owner)
            <textarea
              className={`${fieldClassName} min-h-[80px] font-normal`}
              maxLength={SUSPEND_REASON_MAX}
              onChange={(event) => setReason(event.target.value)}
              value={reason}
            />
          </label>
          <p className="m-0 text-[0.82rem] text-muted">
            The listing is hidden from students and removed from search. The
            owner is notified.
          </p>
        </>
      ) : (
        <p className="m-0 text-[0.9rem] text-ink">
          Make this listing live again? It returns to search and the owner is
          notified.
        </p>
      )}

      {shownError ? (
        <p className="m-0 text-[0.875rem] text-[#c13515]" role="alert">
          {shownError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          className={mode === "suspend" ? dangerButtonClassName : primaryButtonClassName}
          disabled={busy || (mode === "verify" && !allChecksDone(checks))}
          type="submit"
        >
          {busy
            ? "Working…"
            : mode === "verify"
              ? "Verify and publish"
              : mode === "suspend"
                ? "Suspend listing"
                : "Reactivate listing"}
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
    </form>
  );
}

export function ReviewDetails({
  listing,
  detail,
  detailError,
  isLoading,
}: {
  listing: AdminListing;
  detail: AdminListingDetail | null;
  detailError: string | null;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-4 rounded-[12px] border border-line p-4">
      {isLoading ? (
        <p className="m-0 text-[0.88rem] text-muted" role="status">
          Loading details...
        </p>
      ) : detailError ? (
        <p className="m-0 text-[0.88rem] text-[#c13515]" role="alert">
          {detailError}
        </p>
      ) : detail ? (
        <div className="grid gap-3 text-[0.88rem] text-ink">
          <p className="m-0">
            <span className="font-semibold">Address:</span> {detail.address}
            {detail.area ? `, ${detail.area}` : ""}, {listing.city}
          </p>
          <p className="m-0">
            <span className="font-semibold">For:</span> {detail.gender.toLowerCase()} ·{" "}
            {detail.capacity} {detail.capacity === 1 ? "bed" : "beds"} · from{" "}
            {currencyFormatter.format(detail.pricePerMonth)} / month
          </p>
          {detail.rooms.length > 0 ? (
            <ul className="m-0 grid list-disc gap-1 pl-5">
              {detail.rooms.map((room) => (
                <li key={room.id}>
                  {room.name}: {currencyFormatter.format(room.pricePerMonth)} ·{" "}
                  {room.capacity} {room.capacity === 1 ? "bed" : "beds"}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="m-0">
            <span className="font-semibold">Owner:</span> {detail.ownerName} (
            {detail.ownerEmail})
            {detail.ownerSince
              ? ` · member since ${dateFormatter.format(new Date(detail.ownerSince))}`
              : ""}{" "}
            · {detail.ownerListingCount}{" "}
            {detail.ownerListingCount === 1 ? "listing" : "listings"}
          </p>
        </div>
      ) : null}

      {listing.images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {listing.images.map((src, index) => (
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-surface-muted"
              key={`${src}-${index}`}
            >
              <Image
                alt={`${listing.name} photo ${index + 1}`}
                className="object-cover"
                fill
                sizes="160px"
                src={src}
                unoptimized
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 text-[0.88rem] text-muted">No photos uploaded.</p>
      )}

      <p className="m-0 whitespace-pre-line text-[0.9rem] text-ink">
        {listing.description || "No description."}
      </p>
      {listing.amenities.length > 0 ? (
        <p className="m-0 text-[0.85rem] text-muted">
          <span className="font-semibold text-ink">Amenities:</span>{" "}
          {listing.amenities.join(", ")}
        </p>
      ) : null}
      {listing.rules.length > 0 ? (
        <p className="m-0 text-[0.85rem] text-muted">
          <span className="font-semibold text-ink">House rules:</span>{" "}
          {listing.rules.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function ListingReviewCard({
  listing,
  onModerate,
}: {
  listing: AdminListing;
  onModerate: ModerateAction;
}) {
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel] = useState<ModerationAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminListingDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!expanded || detail || detailError) return;
    const controller = new AbortController();
    setDetailLoading(true);
    fetch(`/api/hostels/${encodeURIComponent(listing.id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(readAdminError(payload, "Could not load the details."));
        }
        const parsed = parseAdminListingDetail(payload);
        if (!parsed) throw new Error("Could not load the details.");
        setDetail(parsed);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setDetailError(
          cause instanceof Error ? cause.message : "Could not load the details.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [expanded, detail, detailError, listing.id]);

  async function submit(
    action: ModerationAction,
    input: { reason: string; checks: VerificationChecks; notes: string },
  ) {
    setBusy(true);
    setError(null);
    const result = await onModerate(
      listing,
      action,
      buildModerationBody(listing.id, action, input),
    );
    // On success the parent removes this card, so only failures need state.
    setBusy(false);
    if (result.error) setError(result.error);
  }

  const lowCompleteness = listing.completeness < FLAGGED_THRESHOLD;

  return (
    <li className="grid gap-3 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-[1.02rem] font-semibold text-ink">
          {listing.name}
        </h3>
        {listing.verified ? (
          <span className="rounded-full bg-brand-soft px-[10px] py-[2px] text-[0.72rem] font-bold text-brand-dark">
            Verified
          </span>
        ) : null}
        <span
          className={`rounded-full px-[10px] py-[2px] text-[0.72rem] font-bold ${lowCompleteness ? "bg-[#fbf4e6] text-[#583c13]" : "bg-surface-muted text-muted"}`}
        >
          {listing.completeness}% complete
        </span>
      </div>
      <p className="m-0 text-[0.85rem] text-muted">
        {listing.city} · {listing.ownerName} ({listing.ownerEmail}) · added{" "}
        {dateFormatter.format(new Date(listing.createdAt))}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          aria-expanded={expanded}
          className={secondaryButtonClassName}
          onClick={() => setExpanded((open) => !open)}
          type="button"
        >
          {expanded ? "Hide details" : "Review details"}
        </button>
        {listing.status === "PENDING_REVIEW" ? (
          <button
            className={secondaryButtonClassName}
            onClick={() => setPanel(panel === "verify" ? null : "verify")}
            type="button"
          >
            Verify and publish
          </button>
        ) : null}
        {listing.status === "PENDING_REVIEW" || listing.status === "ACTIVE" ? (
          <button
            className={secondaryButtonClassName}
            onClick={() => setPanel(panel === "suspend" ? null : "suspend")}
            type="button"
          >
            Suspend
          </button>
        ) : null}
        {listing.status === "SUSPENDED" ? (
          <button
            className={secondaryButtonClassName}
            onClick={() => setPanel(panel === "activate" ? null : "activate")}
            type="button"
          >
            Reactivate
          </button>
        ) : null}
        {listing.status === "ACTIVE" ? (
          <Link
            className={secondaryButtonClassName}
            href={`/hostels/${encodeURIComponent(listing.slug)}`}
          >
            View public page
          </Link>
        ) : null}
      </div>

      {expanded ? (
        <ReviewDetails
          detail={detail}
          detailError={detailError}
          isLoading={detailLoading}
          listing={listing}
        />
      ) : null}

      {panel ? (
        <ModerationForm
          busy={busy}
          error={error}
          mode={panel}
          onCancel={() => {
            setPanel(null);
            setError(null);
          }}
          onSubmit={(input) => void submit(panel, input)}
        />
      ) : null}
    </li>
  );
}

export interface AdminListingsContentProps {
  status: AdminListingStatus;
  searchInput: string;
  listings: AdminListing[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  notice: { tone: "success" | "error"; text: string } | null;
  onStatusChange: (status: AdminListingStatus) => void;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onModerate: ModerateAction;
}

export function AdminListingsContent({
  status,
  searchInput,
  listings,
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
  onModerate,
}: AdminListingsContentProps) {
  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/admin"
      >
        ← Back to admin console
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Listing review
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Check new listings before students can see them.
      </p>

      <div className="grid gap-5">
        <div aria-label="Listing status" className="flex flex-wrap gap-2" role="group">
          {ADMIN_LISTING_TABS.map((tab) => (
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
            aria-label="Search listings by name, city or slug"
            className={fieldClassName}
            maxLength={200}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search by name, city or slug"
            type="search"
            value={searchInput}
          />
          <button className={secondaryButtonClassName} type="submit">
            Search
          </button>
        </form>

        {notice ? (
          <p
            className={`m-0 rounded-[14px] px-[13px] py-[11px] text-[0.875rem] ${notice.tone === "success" ? "bg-brand-soft text-brand-dark" : "bg-surface-muted text-[#c13515]"}`}
            role={notice.tone === "success" ? "status" : "alert"}
          >
            {notice.text}
          </p>
        ) : null}

        <FormSection title="Listings">
          {isLoading ? (
            <p className="m-0 text-muted" role="status">
              Loading listings...
            </p>
          ) : loadError ? (
            <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
              <p className="m-0 text-[#c13515]">{loadError}</p>
              <button
                className={`${secondaryButtonClassName} mt-3`}
                onClick={onRetry}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : listings.length === 0 ? (
            <p className="m-0 text-[0.92rem] text-muted">
              {status === "PENDING_REVIEW"
                ? "Nothing waiting for review."
                : "No listings match."}
            </p>
          ) : (
            <>
              <p aria-live="polite" className="m-0 text-[0.85rem] text-muted">
                {total} {total === 1 ? "listing" : "listings"}
              </p>
              <ul className="m-0 grid list-none gap-3 p-0">
                {listings.map((listing) => (
                  <ListingReviewCard
                    key={listing.id}
                    listing={listing}
                    onModerate={onModerate}
                  />
                ))}
              </ul>
            </>
          )}
          {moreError ? (
            <p
              className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-[#c13515]"
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

async function fetchListings(
  status: AdminListingStatus,
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
  const response = await fetch(`/api/admin/listings?${params.toString()}`, { signal });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readAdminError(payload, "Could not load listings."));
  }
  const parsed = parseAdminListingsPage(payload);
  if (!parsed) throw new Error("Could not load listings.");
  return parsed;
}

export function AdminListingsPage() {
  const [status, setStatus] = useState<AdminListingStatus>("PENDING_REVIEW");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<AdminListing[]>([]);
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
    fetchListings(status, search, 1, controller.signal)
      .then((result) => {
        setListings(result.data);
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load listings.",
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
      const result = await fetchListings(status, search, page + 1);
      setListings((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error ? error.message : "Could not load more listings.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [status, search, page]);

  const moderate = useCallback<ModerateAction>(async (listing, action, body) => {
    try {
      const response = await fetch("/api/admin/hostels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        // The listing's status changed, so it no longer belongs in this tab.
        setListings((current) => current.filter((item) => item.id !== listing.id));
        setTotal((current) => Math.max(0, current - 1));
        setNotice({
          tone: "success",
          text: moderationSuccessMessage(action, listing.name),
        });
        return { error: null };
      }
      const payload: unknown = await response.json().catch(() => null);
      const message = readAdminError(
        payload,
        "We couldn't update this listing. Please try again.",
      );
      if (response.status === 409) {
        // Someone else changed it; show the fresh queue.
        setNotice({ tone: "error", text: message });
        setRetryCount((count) => count + 1);
      }
      return { error: message };
    } catch {
      return { error: "We couldn't update this listing. Please try again." };
    }
  }, []);

  return (
    <AdminListingsContent
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      listings={listings}
      loadError={loadError}
      moreError={moreError}
      notice={notice}
      onLoadMore={() => void loadMore()}
      onModerate={moderate}
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
      total={total}
    />
  );
}
