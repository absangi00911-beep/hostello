// Path: src/app/owner/earnings/page.tsx
"use client";

import { useState, useEffect } from "react";
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

interface EarningsData {
  pendingBalance: number;
  hasBankDetails: boolean;
  bankDetails: { bankAccountTitle: string; bankAccountNumber: string; bankName: string } | null;
  payouts: PayoutRow[];
}

const PAYOUT_STATUS_BADGES = {
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

function BankDetailsForm({ initial }: { initial: EarningsData["bankDetails"] }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initial?.bankAccountTitle ?? "");
  const [number, setNumber] = useState(initial?.bankAccountNumber ?? "");
  const [bank, setBank] = useState(initial?.bankName ?? "");

  useEffect(() => {
    setTitle(initial?.bankAccountTitle ?? "");
    setNumber(initial?.bankAccountNumber ?? "");
    setBank(initial?.bankName ?? "");
  }, [initial]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/owner/earnings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountTitle: title,
          bankAccountNumber: number,
          bankName: bank,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save bank details");
      return json;
    },
    onSuccess: () => {
      toast.success("Bank details saved.");
      queryClient.invalidateQueries({ queryKey: ["owner-earnings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inputClass =
    "h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 text-[var(--text-body-sm)] text-[var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 space-y-3">
      <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)]">
        Payout bank details
      </p>
      <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
        We pay out by bank transfer. This is where an admin will send your balance once a payout batch is marked paid.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-[var(--text-caption)] text-[var(--color-text-muted)] mb-1">
            Account title
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-[var(--text-caption)] text-[var(--color-text-muted)] mb-1">
            Account number / IBAN
          </label>
          <input value={number} onChange={(e) => setNumber(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-[var(--text-caption)] text-[var(--color-text-muted)] mb-1">
            Bank name
          </label>
          <input value={bank} onChange={(e) => setBank(e.target.value)} className={inputClass} />
        </div>
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || !title.trim() || !number.trim() || !bank.trim()}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-action)] text-white text-[var(--text-body-sm)] font-[600] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saveMutation.isPending && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
        Save bank details
      </button>
    </div>
  );
}

export default function OwnerEarningsPage() {
  const { data, isLoading, isError } = useQuery<EarningsData>({
    queryKey: ["owner-earnings"],
    queryFn: async () => {
      const res = await fetch("/api/owner/earnings");
      if (!res.ok) throw new Error("Failed to load earnings");
      return res.json();
    },
  });

  if (isLoading) return <PageSpinner label="Loading earnings…" />;
  if (isError || !data) return <InlineError message="Couldn't load your earnings. Please refresh." />;

  return (
    <div className="space-y-6">
      {/* Pending balance */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6">
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] mb-1">Pending balance</p>
        <p className="text-[28px] font-[600] text-[var(--color-primary-deep)]">
          {formatPKR(data.pendingBalance)}
        </p>
        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-1">
          Bookings become eligible for payout once the stay's checkout date has passed. An admin generates
          and sends payout batches manually — there's no fixed schedule yet.
        </p>

        {!data.hasBankDetails && data.pendingBalance > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-warning-text)]">
            <AlertTriangle size={14} aria-hidden="true" />
            Add your bank details below so we know where to send this.
          </div>
        )}
      </div>

      {/* Bank details */}
      <BankDetailsForm initial={data.bankDetails} />

      {/* Payout history */}
      <div>
        <h2 className="text-[var(--text-heading-sm)] font-[600] text-[var(--color-text-heading)] mb-3">
          Payout history
        </h2>

        {data.payouts.length === 0 ? (
          <EmptyState
            icon={Wallet}
            heading="No payouts yet"
            description="Once a batch is generated for you, it'll show up here."
          />
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]" aria-label="Payout history">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)]">
                    {["Amount", "Status", "Created", "Paid", "Reference"].map((h) => (
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
                  {data.payouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="border-b border-[var(--color-border-subtle)] last:border-b-0"
                    >
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
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                          {payout.paidAt ? format(new Date(payout.paidAt), "d MMM yy") : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                          {payout.reference ?? "—"}
                        </span>
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
