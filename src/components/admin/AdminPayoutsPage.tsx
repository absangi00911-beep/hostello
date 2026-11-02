"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Field,
  FormSection,
  controlProps,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/owner/ListingFormFields";
import { readAdminError } from "./adminListings";
import {
  REFERENCE_MAX,
  VOID_REASON_MAX,
  auditActionLabel,
  canGenerateBatch,
  generateBlockedReason,
  parseAdminPayoutsPage,
  validateReference,
  validateVoidReason,
  type AdminPayout,
  type AdminPayoutOwner,
} from "./adminPayouts";

const PAGE_SIZE = 25;

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Karachi",
});

const dangerButtonClassName =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-[#c13515] px-4 text-[0.85rem] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),inset_0_-2px_0_rgb(0_0_0/0.18),0_2px_3px_rgb(15_23_42/0.22)] transition-[background-color,box-shadow,translate] duration-150 hover:bg-[#a52c10] active:translate-y-px active:bg-[#8f240d] active:shadow-[inset_0_3px_6px_rgb(0_0_0/0.3)] disabled:cursor-wait disabled:opacity-60 disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline-2! focus-visible:outline-brand!";

const STATUS_STYLES: Record<AdminPayout["status"], string> = {
  PENDING: "bg-[#fbf4e6] text-[#583c13]",
  PAID: "bg-brand-soft text-brand-dark",
  CANCELLED: "bg-surface-muted text-muted",
};

const STATUS_LABELS: Record<AdminPayout["status"], string> = {
  PENDING: "Awaiting transfer",
  PAID: "Paid",
  CANCELLED: "Voided",
};

export interface PayoutActionResult {
  /** Error to show on the card; null when the action succeeded. */
  error: string | null;
}

export type GenerateBatchAction = (
  owner: AdminPayoutOwner,
) => Promise<PayoutActionResult>;
export type MarkPaidAction = (
  owner: AdminPayoutOwner,
  payout: AdminPayout,
  reference: string,
) => Promise<PayoutActionResult>;
export type VoidAction = (
  owner: AdminPayoutOwner,
  payout: AdminPayout,
  reason: string,
) => Promise<PayoutActionResult>;

function PayoutDestinationBlock({ payout }: { payout: AdminPayout }) {
  if (payout.status !== "PENDING") return null;
  if (payout.destinationStatus === "available" && payout.destination) {
    return (
      <dl className="m-0 grid gap-1 rounded-[12px] bg-surface-muted p-3 text-[0.85rem]">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Account title</dt>
          <dd className="m-0 font-semibold text-ink">
            {payout.destination.bankAccountTitle}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Account number</dt>
          <dd className="m-0 font-semibold text-ink">
            {payout.destination.bankAccountNumber}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Bank</dt>
          <dd className="m-0 font-semibold text-ink">
            {payout.destination.bankName}
          </dd>
        </div>
      </dl>
    );
  }
  return (
    <p className="m-0 rounded-[12px] bg-surface-muted p-3 text-[0.85rem] text-[#c13515]">
      {payout.destinationStatus === "missing"
        ? "No bank details were saved with this batch. Void it and generate a new one after the owner completes their bank details."
        : "The saved bank details could not be decrypted. Void this batch and generate a new one."}
    </p>
  );
}

export function MarkPaidForm({
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  busy: boolean;
  error: string | null;
  onConfirm: (reference: string) => void;
  onCancel: () => void;
}) {
  const [reference, setReference] = useState("");
  const [touched, setTouched] = useState(false);
  const fieldError = touched ? validateReference(reference) : null;

  return (
    <div className="grid gap-3 rounded-[12px] bg-surface-muted p-4">
      <p className="m-0 text-[0.9rem] text-ink">
        Only mark this paid after the transfer has left your bank. The owner is
        told the money is on its way, and this cannot be undone.
      </p>
      <Field
        error={fieldError ?? undefined}
        id="payout-reference"
        label="Transfer reference"
      >
        <input
          {...controlProps("payout-reference", fieldError ?? undefined)}
          className={fieldClassName}
          maxLength={REFERENCE_MAX}
          onChange={(event) => setReference(event.target.value)}
          value={reference}
        />
      </Field>
      {error ? (
        <p className="m-0 text-[0.875rem] text-[#c13515]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          className={primaryButtonClassName}
          disabled={busy}
          onClick={() => {
            setTouched(true);
            if (!validateReference(reference)) onConfirm(reference.trim());
          }}
          type="button"
        >
          {busy ? "Working…" : "Mark as paid"}
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

export function VoidForm({
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  busy: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [touched, setTouched] = useState(false);
  const fieldError = touched ? validateVoidReason(reason) : null;

  return (
    <div className="grid gap-3 rounded-[12px] bg-surface-muted p-4">
      <p className="m-0 text-[0.9rem] text-ink">
        Voiding releases the bookings in this batch so they return to the
        owner&apos;s ready-for-payout balance. Do this only if no transfer was
        sent.
      </p>
      <Field
        error={fieldError ?? undefined}
        id="payout-void-reason"
        label="Reason"
      >
        <textarea
          {...controlProps("payout-void-reason", fieldError ?? undefined)}
          className={fieldClassName}
          maxLength={VOID_REASON_MAX}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          value={reason}
        />
      </Field>
      <label className="flex items-start gap-2 text-[0.88rem] text-ink">
        <input
          checked={confirmed}
          className="mt-1"
          onChange={(event) => setConfirmed(event.target.checked)}
          type="checkbox"
        />
        <span>I confirm that no transfer was sent for this batch.</span>
      </label>
      {error ? (
        <p className="m-0 text-[0.875rem] text-[#c13515]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          className={dangerButtonClassName}
          disabled={busy || !confirmed}
          onClick={() => {
            setTouched(true);
            if (!validateVoidReason(reason)) onConfirm(reason.trim());
          }}
          type="button"
        >
          {busy ? "Working…" : "Void batch"}
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

function PayoutRow({
  owner,
  payout,
  onMarkPaid,
  onVoid,
}: {
  owner: AdminPayoutOwner;
  payout: AdminPayout;
  onMarkPaid: MarkPaidAction;
  onVoid: VoidAction;
}) {
  const [mode, setMode] = useState<"paid" | "void" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<PayoutActionResult>) {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.error) setError(result.error);
    else setMode(null);
  }

  return (
    <li className="grid gap-3 rounded-[12px] border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[1rem] font-semibold text-ink">
          {currencyFormatter.format(payout.amount)}
        </span>
        <span
          className={`rounded-full px-[10px] py-[2px] text-[0.72rem] font-bold ${STATUS_STYLES[payout.status]}`}
        >
          {STATUS_LABELS[payout.status]}
        </span>
        <span className="text-[0.78rem] text-muted">
          Created {dateFormatter.format(new Date(payout.createdAt))}
        </span>
      </div>

      {payout.status === "PAID" ? (
        <p className="m-0 text-[0.85rem] text-muted">
          Paid
          {payout.paidAt
            ? ` ${dateFormatter.format(new Date(payout.paidAt))}`
            : ""}
          {payout.reference ? ` · reference ${payout.reference}` : ""}
        </p>
      ) : null}
      {payout.status === "CANCELLED" ? (
        <p className="m-0 text-[0.85rem] text-muted">
          Voided
          {payout.cancelledAt
            ? ` ${dateFormatter.format(new Date(payout.cancelledAt))}`
            : ""}
          {payout.cancellationReason ? ` · ${payout.cancellationReason}` : ""}
        </p>
      ) : null}

      <PayoutDestinationBlock payout={payout} />

      {payout.auditEvents.length > 0 ? (
        <ul className="m-0 grid list-none gap-1 p-0 text-[0.78rem] text-muted">
          {payout.auditEvents.map((event) => (
            <li key={event.id}>
              {auditActionLabel(event.action)} ·{" "}
              {dateFormatter.format(new Date(event.createdAt))}
            </li>
          ))}
        </ul>
      ) : null}

      {payout.status === "PENDING" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                setError(null);
                setMode(mode === "paid" ? null : "paid");
              }}
              type="button"
            >
              Mark as paid
            </button>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                setError(null);
                setMode(mode === "void" ? null : "void");
              }}
              type="button"
            >
              Void batch
            </button>
          </div>
          {mode === "paid" ? (
            <MarkPaidForm
              busy={busy}
              error={error}
              onCancel={() => setMode(null)}
              onConfirm={(reference) =>
                void run(() => onMarkPaid(owner, payout, reference))
              }
            />
          ) : null}
          {mode === "void" ? (
            <VoidForm
              busy={busy}
              error={error}
              onCancel={() => setMode(null)}
              onConfirm={(reason) =>
                void run(() => onVoid(owner, payout, reason))
              }
            />
          ) : null}
        </>
      ) : null}
    </li>
  );
}

function OwnerCard({
  owner,
  payoutHistoryPerOwner,
  onGenerate,
  onMarkPaid,
  onVoid,
}: {
  owner: AdminPayoutOwner;
  payoutHistoryPerOwner: number;
  onGenerate: GenerateBatchAction;
  onMarkPaid: MarkPaidAction;
  onVoid: VoidAction;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = generateBlockedReason(owner);

  async function generate() {
    setBusy(true);
    setError(null);
    const result = await onGenerate(owner);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  return (
    <li className="grid gap-3 rounded-[14px] border border-line bg-surface p-4">
      <div className="grid gap-[2px]">
        <h3 className="m-0 text-[1.02rem] font-semibold text-ink">
          {owner.name}
        </h3>
        <p className="m-0 text-[0.85rem] text-muted">{owner.email}</p>
      </div>
      <p className="m-0 text-[0.9rem] text-ink">
        Ready for payout:{" "}
        <strong>{currencyFormatter.format(owner.pendingBalance)}</strong>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className={secondaryButtonClassName}
          disabled={busy || !canGenerateBatch(owner)}
          onClick={() => void generate()}
          type="button"
        >
          {busy ? "Working…" : "Generate payout batch"}
        </button>
        {blocked ? (
          <span className="text-[0.8rem] text-muted">{blocked}</span>
        ) : null}
      </div>
      {error ? (
        <p className="m-0 text-[0.875rem] text-[#c13515]" role="alert">
          {error}
        </p>
      ) : null}

      {owner.payouts.length > 0 ? (
        <div className="grid gap-2">
          <h4 className="m-0 text-[0.9rem] font-semibold text-ink">Payouts</h4>
          <ul className="m-0 grid list-none gap-3 p-0">
            {owner.payouts.map((payout) => (
              <PayoutRow
                key={payout.id}
                onMarkPaid={onMarkPaid}
                onVoid={onVoid}
                owner={owner}
                payout={payout}
              />
            ))}
          </ul>
          {owner.payoutHistoryTruncated ? (
            <p className="m-0 text-[0.78rem] text-muted">
              Showing the latest {payoutHistoryPerOwner} payouts.
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export interface AdminPayoutsContentProps {
  owners: AdminPayoutOwner[];
  total: number;
  payoutHistoryPerOwner: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  notice: { tone: "success" | "error"; text: string } | null;
  onRetry: () => void;
  onLoadMore: () => void;
  onGenerate: GenerateBatchAction;
  onMarkPaid: MarkPaidAction;
  onVoid: VoidAction;
}

export function AdminPayoutsContent({
  owners,
  total,
  payoutHistoryPerOwner,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  moreError,
  notice,
  onRetry,
  onLoadMore,
  onGenerate,
  onMarkPaid,
  onVoid,
}: AdminPayoutsContentProps) {
  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/admin"
      >
        ← Back to admin console
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Owner payouts
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Generate a payout batch for an owner, send the bank transfer yourself,
        then record the reference here. HostelLo does not move the money.
      </p>

      <div className="grid gap-5">
        {notice ? (
          <p
            className={`m-0 rounded-[14px] px-[13px] py-[11px] text-[0.875rem] ${notice.tone === "success" ? "bg-brand-soft text-brand-dark" : "bg-surface-muted text-[#c13515]"}`}
            role={notice.tone === "success" ? "status" : "alert"}
          >
            {notice.text}
          </p>
        ) : null}

        <FormSection title="Owners">
          {isLoading ? (
            <p className="m-0 text-muted" role="status">
              Loading payouts...
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
          ) : owners.length === 0 ? (
            <p className="m-0 text-[0.92rem] text-muted">
              No owners have money ready for payout or past payouts.
            </p>
          ) : (
            <>
              <p aria-live="polite" className="m-0 text-[0.85rem] text-muted">
                {total} {total === 1 ? "owner" : "owners"}
              </p>
              <ul className="m-0 grid list-none gap-3 p-0">
                {owners.map((owner) => (
                  <OwnerCard
                    key={owner.id}
                    onGenerate={onGenerate}
                    onMarkPaid={onMarkPaid}
                    onVoid={onVoid}
                    owner={owner}
                    payoutHistoryPerOwner={payoutHistoryPerOwner}
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

async function fetchPayouts(page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const response = await fetch(`/api/admin/payouts?${params.toString()}`, {
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readAdminError(payload, "Could not load payouts."));
  }
  const parsed = parseAdminPayoutsPage(payload);
  if (!parsed) throw new Error("Could not load payouts.");
  return parsed;
}

export function AdminPayoutsPage() {
  const [owners, setOwners] = useState<AdminPayoutOwner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [historyPerOwner, setHistoryPerOwner] = useState(20);
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
    fetchPayouts(1, controller.signal)
      .then((result) => {
        setOwners(result.data);
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.hasMore);
        setHistoryPerOwner(result.payoutHistoryPerOwner);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load payouts.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [retryCount]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const result = await fetchPayouts(page + 1);
      setOwners((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error ? error.message : "Could not load more owners.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [page]);

  /** Shared write helper: refreshes the list after success or a 409/404. */
  const send = useCallback(
    async (
      url: string,
      method: "POST" | "PATCH",
      body: unknown,
      successText: string,
      fallback: string,
    ): Promise<PayoutActionResult> => {
      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (response.ok) {
          setNotice({ tone: "success", text: successText });
          setRetryCount((count) => count + 1);
          return { error: null };
        }
        const payload: unknown = await response.json().catch(() => null);
        const message = readAdminError(payload, fallback);
        if (response.status === 404 || response.status === 409) {
          // Someone else changed it, or the state moved on; show fresh data.
          setNotice({ tone: "error", text: message });
          setRetryCount((count) => count + 1);
        }
        return { error: message };
      } catch {
        return { error: fallback };
      }
    },
    [],
  );

  const generate = useCallback<GenerateBatchAction>(
    (owner) =>
      send(
        "/api/admin/payouts",
        "POST",
        { ownerId: owner.id },
        `Payout batch created for ${owner.name}.`,
        "We couldn't create the batch. Please try again.",
      ),
    [send],
  );

  const markPaid = useCallback<MarkPaidAction>(
    (owner, payout, reference) =>
      send(
        `/api/admin/payouts/${encodeURIComponent(payout.id)}`,
        "PATCH",
        { action: "mark-paid", reference },
        `Payout to ${owner.name} marked as paid.`,
        "We couldn't mark this payout as paid. Please try again.",
      ),
    [send],
  );

  const voidBatch = useCallback<VoidAction>(
    (owner, payout, reason) =>
      send(
        `/api/admin/payouts/${encodeURIComponent(payout.id)}`,
        "PATCH",
        { action: "void", reason, confirmTransferNotSent: true },
        `Payout batch for ${owner.name} voided.`,
        "We couldn't void this batch. Please try again.",
      ),
    [send],
  );

  return (
    <AdminPayoutsContent
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      loadError={loadError}
      moreError={moreError}
      notice={notice}
      onGenerate={generate}
      onLoadMore={() => void loadMore()}
      onMarkPaid={markPaid}
      onRetry={() => setRetryCount((count) => count + 1)}
      onVoid={voidBatch}
      owners={owners}
      payoutHistoryPerOwner={historyPerOwner}
      total={total}
    />
  );
}
