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

interface PayoutRow {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  reference: string | null;
  createdAt: string;
  paidAt: string | null;
}

interface OwnerRow {
  id: string;
  name: string | null;
  email: string | null;
  hasBankDetails: boolean;
  pendingBalance: number;
  payouts: PayoutRow[];
}

const PAYOUT_STATUS_BADGES = {
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const [actingOwnerId, setActingOwnerId] = useState<string | null>(null);
  const [actingPayoutId, setActingPayoutId] = useState<string | null>(null);
  const [referenceDrafts, setReferenceDrafts] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery<{ data: OwnerRow[] }>({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payouts");
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
        body: JSON.stringify({ reference }),
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

  if (isLoading) return <PageSpinner label="Loading payouts…" />;
  if (isError) return <InlineError message="Couldn't load payouts. Please refresh." />;

  const owners = data?.data ?? [];
  const withBalance = owners.filter((o) => o.pendingBalance > 0);
  const allPayouts = owners
    .flatMap((o) => o.payouts.map((p) => ({ ...p, ownerName: o.name, ownerEmail: o.email })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8">
      {/* Pending balances */}
      <div>
        <h2 className="text-[var(--text-heading-sm)] font-[600] text-[var(--color-text-heading)] mb-3">
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
                        className="px-4 py-3 text-left text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] whitespace-nowrap"
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
                        <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)]">
                          {owner.name ?? "—"}
                        </p>
                        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">{owner.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {owner.hasBankDetails ? (
                          <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">On file</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[var(--text-body-sm)] text-[var(--color-warning-text)]">
                            <AlertTriangle size={13} aria-hidden="true" /> Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-primary-deep)]">
                          {formatPKR(owner.pendingBalance)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => generateMutation.mutate(owner.id)}
                          disabled={!owner.hasBankDetails || generateMutation.isPending}
                          title={owner.hasBankDetails ? undefined : "Owner hasn't added bank details yet"}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-action)]/40 text-[var(--text-caption)] font-[600] text-[var(--color-action)] hover:bg-[var(--color-action)] hover:text-white hover:border-[var(--color-action)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
        <h2 className="text-[var(--text-heading-sm)] font-[600] text-[var(--color-text-heading)] mb-3">
          Payout batches
        </h2>

        {allPayouts.length === 0 ? (
          <EmptyState icon={Wallet} heading="No payouts yet" description="Generated batches will show up here." />
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]" aria-label="Payout batches">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)]">
                    {["Owner", "Amount", "Status", "Created", "Reference", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] whitespace-nowrap"
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
                        <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)]">
                          {payout.ownerName ?? "—"}
                        </p>
                        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">{payout.ownerEmail}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-primary-deep)]">
                          {formatPKR(payout.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge variant={PAYOUT_STATUS_BADGES[payout.status]} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                          {format(new Date(payout.createdAt), "d MMM yy")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {payout.status === "PENDING" ? (
                          <input
                            type="text"
                            placeholder="Bank/JazzCash ref"
                            value={referenceDrafts[payout.id] ?? ""}
                            onChange={(e) =>
                              setReferenceDrafts((prev) => ({ ...prev, [payout.id]: e.target.value }))
                            }
                            className="h-7 w-32 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-2 text-[var(--text-caption)] text-[var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)]"
                          />
                        ) : (
                          <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                            {payout.reference ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {payout.status === "PENDING" && (
                          <button
                            onClick={() =>
                              markPaidMutation.mutate({
                                payoutId: payout.id,
                                reference: referenceDrafts[payout.id]?.trim() || undefined,
                              })
                            }
                            disabled={markPaidMutation.isPending}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-action)]/40 text-[var(--text-caption)] font-[600] text-[var(--color-action)] hover:bg-[var(--color-action)] hover:text-white hover:border-[var(--color-action)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50 whitespace-nowrap"
                          >
                            {actingPayoutId === payout.id && markPaidMutation.isPending && (
                              <Loader2 size={10} className="animate-spin" aria-hidden="true" />
                            )}
                            Mark paid
                          </button>
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
    </div>
  );
}
