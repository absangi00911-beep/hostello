// Path: src/app/admin/payouts/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Wallet, Loader2, AlertTriangle } from "lucide-react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
  StatusBadge,
  formatPKR,
} from "@/components/ui/shared";

interface PayoutAuditEventRow {
  id: string;
  actorId: string;
  action: "BATCH_CREATED" | "MARKED_PAID" | "VOIDED";
  amount: number;
  reference: string | null;
  reason: string | null;
  createdAt: string;
}

interface PayoutRow {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  reference: string | null;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  destinationSnapshot: {
    bankAccountTitle: string;
    bankAccountNumber: string;
    bankName: string;
  } | null;
  destinationSnapshotStatus: "available" | "missing" | "unavailable" | "not-applicable";
  auditEvents: PayoutAuditEventRow[];
}

interface OwnerRow {
  id: string;
  name: string | null;
  email: string | null;
  hasBankDetails: boolean;
  pendingBalance: number;
  payouts: PayoutRow[];
  payoutHistoryTruncated: boolean;
}

const PAYOUT_STATUS_BADGES = {
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

const PAYOUT_AUDIT_ACTION_LABELS: Record<PayoutAuditEventRow["action"], string> = {
  BATCH_CREATED: "Batch generated",
  MARKED_PAID: "Marked paid",
  VOIDED: "Voided",
};

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const [actingOwnerId, setActingOwnerId] = useState<string | null>(null);
  const [actingPayoutId, setActingPayoutId] = useState<string | null>(null);
  const [referenceDrafts, setReferenceDrafts] = useState<Record<string, string>>({});
  const [voidingPayoutId, setVoidingPayoutId] = useState<string | null>(null);
  const [voidReasonDrafts, setVoidReasonDrafts] = useState<Record<string, string>>({});
  const [voidConfirmations, setVoidConfirmations] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<{
    data: OwnerRow[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    payoutHistoryPerOwner: number;
  }>({
    queryKey: ["admin-payouts", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/payouts?page=${page}&limit=25`);
      if (!res.ok) throw new Error("Failed to load payouts");
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (ownerId: string) => {
      setActingOwnerId(ownerId);
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate payout batch");
      return json;
    },
    onSuccess: () => {
      toast.success("Payout batch generated.");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setActingOwnerId(null),
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ payoutId, reference }: { payoutId: string; reference?: string }) => {
      setActingPayoutId(payoutId);
      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-paid", reference }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to mark payout paid");
      return json;
    },
    onSuccess: () => {
      toast.success("Payout marked paid.");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setActingPayoutId(null),
  });

  const voidMutation = useMutation({
    mutationFn: async ({ payoutId, reason }: { payoutId: string; reason: string }) => {
      setActingPayoutId(payoutId);
      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "void", reason, confirmTransferNotSent: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to void payout batch");
      return json;
    },
    onSuccess: (_, variables) => {
      toast.success("Payout batch voided and its bookings released.");
      setVoidingPayoutId(null);
      setVoidReasonDrafts((prev) => ({ ...prev, [variables.payoutId]: "" }));
      setVoidConfirmations((prev) => ({ ...prev, [variables.payoutId]: false }));
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setActingPayoutId(null),
  });

  if (isLoading) return <PageSpinner label="Loading payouts…" />;
  if (isError) return <InlineError message="Couldn't load payouts. Please refresh." />;

  const owners = data?.data ?? [];
  const withBalance = owners.filter((o) => o.pendingBalance > 0);
  const allPayouts = owners
    .flatMap((o) => o.payouts.map((p) => ({ ...p, ownerName: o.name, ownerEmail: o.email })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const truncatedHistory = owners.some((owner) => owner.payoutHistoryTruncated);

  return (
    <div className="space-y-8">
      {/* Pending balances */}
      <div>
        <h2 className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)] mb-3">
          Pending balances
        </h2>

        {withBalance.length === 0 ? (
          <EmptyState
            icon={Wallet}
            heading="Nothing pending"
            description="No owner currently has an eligible, unbatched balance."
          />
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]" aria-label="Owners with a pending balance">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)]">
                    {["Owner", "Bank details", "Pending balance", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[length:var(--text-label)] font-[600] text-[color:var(--color-text-muted)] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withBalance.map((owner) => (
                    <tr
                      key={owner.id}
                      className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-heading)]">
                          {owner.name ?? "—"}
                        </p>
                        <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">{owner.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {owner.hasBankDetails ? (
                          <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">On file</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[length:var(--text-body-sm)] text-[color:var(--color-warning-text)]">
                            <AlertTriangle size={13} aria-hidden="true" /> Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-primary-deep)]">
                          {formatPKR(owner.pendingBalance)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => generateMutation.mutate(owner.id)}
                          disabled={!owner.hasBankDetails || generateMutation.isPending}
                          title={owner.hasBankDetails ? undefined : "Owner hasn't added bank details yet"}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-action)]/40 text-[length:var(--text-caption)] font-[600] text-[color:var(--color-action)] hover:bg-[var(--color-action)] hover:text-[color:var(--color-text-inverse)] hover:border-[var(--color-action)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {actingOwnerId === owner.id && generateMutation.isPending && (
                            <Loader2 size={10} className="animate-spin" aria-hidden="true" />
                          )}
                          Generate batch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payout history */}
      <div>
        <h2 className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)] mb-3">
          Payout batches
        </h2>
        {truncatedHistory && (
          <p className="mb-3 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            Showing the latest {data?.payoutHistoryPerOwner ?? 20} batches per owner on this page.
          </p>
        )}

        {allPayouts.length === 0 ? (
          <EmptyState icon={Wallet} heading="No payouts yet" description="Generated batches will show up here." />
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]" aria-label="Payout batches">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)]">
                    {["Owner", "Amount", "Status", "Created", "Transfer details", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[length:var(--text-label)] font-[600] text-[color:var(--color-text-muted)] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPayouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-heading)]">
                          {payout.ownerName ?? "—"}
                        </p>
                        <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">{payout.ownerEmail}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-primary-deep)]">
                          {formatPKR(payout.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1.5">
                          <StatusBadge variant={PAYOUT_STATUS_BADGES[payout.status]} />
                          <details className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                            <summary className="cursor-pointer font-[600] text-[color:var(--color-primary)]">
                              Audit history ({payout.auditEvents.length})
                            </summary>
                            {payout.auditEvents.length > 0 ? (
                              <ol className="mt-1 space-y-2">
                                {payout.auditEvents.map((event) => (
                                  <li key={event.id} className="border-l border-[var(--color-border-default)] pl-2">
                                    <p className="font-[600] text-[color:var(--color-text-heading)]">
                                      {PAYOUT_AUDIT_ACTION_LABELS[event.action]} · {format(new Date(event.createdAt), "d MMM yy, HH:mm")}
                                    </p>
                                    <p>{formatPKR(event.amount)} · admin {event.actorId}</p>
                                    {event.reference && <p>Reference: {event.reference}</p>}
                                    {event.reason && <p>Reason: {event.reason}</p>}
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p className="mt-1">No audit events were recorded for this batch.</p>
                            )}
                          </details>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                          {format(new Date(payout.createdAt), "d MMM yy")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {payout.status === "PENDING" ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              required
                              aria-label={`Bank or provider transfer reference for ${payout.ownerName ?? "owner"}`}
                              placeholder="Bank transfer ref"
                              value={referenceDrafts[payout.id] ?? ""}
                              onChange={(e) =>
                                setReferenceDrafts((prev) => ({ ...prev, [payout.id]: e.target.value }))
                              }
                              className="h-7 w-32 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-2 text-[length:var(--text-caption)] text-[color:var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)]"
                            />
                            {payout.destinationSnapshot ? (
                              <details className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                                <summary className="cursor-pointer font-[600] text-[color:var(--color-primary)]">
                                  Frozen destination
                                </summary>
                                <dl className="mt-1 space-y-0.5">
                                  <div><dt className="inline font-[600]">Bank: </dt><dd className="inline">{payout.destinationSnapshot.bankName}</dd></div>
                                  <div><dt className="inline font-[600]">Account title: </dt><dd className="inline">{payout.destinationSnapshot.bankAccountTitle}</dd></div>
                                  <div><dt className="inline font-[600]">Account number: </dt><dd className="inline break-all">{payout.destinationSnapshot.bankAccountNumber}</dd></div>
                                </dl>
                              </details>
                            ) : (
                              <p className="max-w-56 text-[length:var(--text-caption)] text-[color:var(--color-warning-text)]">
                                {payout.destinationSnapshotStatus === "unavailable"
                                  ? "Snapshot cannot be decrypted. Check the encryption key; do not transfer using current account details."
                                  : "Legacy batch has no frozen destination. Verify the destination with the owner before transfer."}
                              </p>
                            )}
                          </div>
                        ) : payout.status === "CANCELLED" ? (
                          <div className="max-w-56">
                            <p className="text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-heading)]">
                              {payout.cancellationReason ?? "Voided"}
                            </p>
                            {payout.cancelledAt && (
                              <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                                {format(new Date(payout.cancelledAt), "d MMM yy")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                            {payout.reference ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {payout.status === "PENDING" && (
                          <div className="min-w-56 space-y-2">
                            <button
                              type="button"
                              onClick={() =>
                                markPaidMutation.mutate({
                                  payoutId: payout.id,
                                  reference: (referenceDrafts[payout.id] ?? "").trim(),
                                })
                              }
                              disabled={markPaidMutation.isPending || voidMutation.isPending || !(referenceDrafts[payout.id] ?? "").trim()}
                              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-action)]/40 text-[length:var(--text-caption)] font-[600] text-[color:var(--color-action)] hover:bg-[var(--color-action)] hover:text-[color:var(--color-text-inverse)] hover:border-[var(--color-action)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
                            >
                              {actingPayoutId === payout.id && markPaidMutation.isPending && (
                                <Loader2 size={10} className="animate-spin" aria-hidden="true" />
                              )}
                              Mark paid
                            </button>
                            <button
                              type="button"
                              aria-expanded={voidingPayoutId === payout.id}
                              aria-controls={`void-payout-${payout.id}`}
                              onClick={() => setVoidingPayoutId((current) => current === payout.id ? null : payout.id)}
                              disabled={markPaidMutation.isPending || voidMutation.isPending}
                              className="block text-[length:var(--text-caption)] font-[600] text-[color:var(--color-error-text)] underline underline-offset-2 disabled:opacity-50"
                            >
                              {voidingPayoutId === payout.id ? "Close void form" : "Void batch"}
                            </button>
                            {voidingPayoutId === payout.id && (
                              <div id={`void-payout-${payout.id}`} className="space-y-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] p-2">
                                <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                                  Only void this batch if no transfer was sent.
                                </p>
                                <textarea
                                  rows={2}
                                  maxLength={500}
                                  aria-label={`Reason for voiding payout for ${payout.ownerName ?? "owner"}`}
                                  placeholder="Reason (10–500 characters)"
                                  value={voidReasonDrafts[payout.id] ?? ""}
                                  onChange={(event) => setVoidReasonDrafts((prev) => ({ ...prev, [payout.id]: event.target.value }))}
                                  className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-2 py-1 text-[length:var(--text-caption)] text-[color:var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)]"
                                />
                                <label className="flex items-start gap-2 text-[length:var(--text-caption)] text-[color:var(--color-text-body)]">
                                  <input
                                    type="checkbox"
                                    checked={voidConfirmations[payout.id] ?? false}
                                    onChange={(event) => setVoidConfirmations((prev) => ({ ...prev, [payout.id]: event.target.checked }))}
                                    className="mt-0.5"
                                  />
                                  I confirm no transfer has been sent.
                                </label>
                                <button
                                  type="button"
                                  onClick={() => voidMutation.mutate({ payoutId: payout.id, reason: (voidReasonDrafts[payout.id] ?? "").trim() })}
                                  disabled={voidMutation.isPending || markPaidMutation.isPending || (voidReasonDrafts[payout.id] ?? "").trim().length < 10 || !voidConfirmations[payout.id]}
                                  className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--color-error)] px-2.5 py-1.5 text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-inverse)] disabled:opacity-50"
                                >
                                  {actingPayoutId === payout.id && voidMutation.isPending && (
                                    <Loader2 size={10} className="animate-spin" aria-hidden="true" />
                                  )}
                                  Void and release bookings
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {(page > 1 || data?.hasMore) && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-md border border-[var(--color-border-default)] px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50"
          >
            Previous owners
          </button>
          <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            Owner page {page} of {Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 25)))}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!data?.hasMore}
            className="rounded-md border border-[var(--color-border-default)] px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50"
          >
            Next owners
          </button>
        </div>
      )}
    </div>
  );
}
