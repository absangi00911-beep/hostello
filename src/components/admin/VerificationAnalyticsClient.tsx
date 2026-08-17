// Path: src/components/admin/VerificationAnalyticsClient.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  FileCheck2,
  Timer,
  CheckCircle2,
  Clock,
  ListChecks,
} from "lucide-react";
import { PageSpinner } from "@/components/ui/shared";
import { VerificationThroughputChart } from "./VerificationThroughputChart";

interface AnalyticsData {
  days: number;
  pendingCount: number;
  totalDecided: number;
  approvalRate: number | null;
  avgProcessingHours: number | null;
  throughput: { date: string; submissions: number; approvals: number }[];
  moderatorPerformance: {
    id: string; name: string; totalReviews: number; approvalRate: number; avgHours: number | null;
  }[];
  trackingSince: string;
}

const RANGES = [7, 30, 90] as const;

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  emphasize = false,
}: {
  icon: typeof FileCheck2;
  iconBg: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border bg-[var(--color-bg-card)] p-5 ${
        emphasize ? "border-l-[3px] border-l-[var(--color-primary)] border-y-[var(--color-border-subtle)] border-r-[var(--color-border-subtle)]" : "border-[var(--color-border-subtle)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)] max-w-[70%]">
          {label}
        </p>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={16} strokeWidth={1.5} style={{ color: iconColor }} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 font-heading text-[2rem] font-[800] text-[var(--color-text-heading)]">
        {value}
      </p>
    </div>
  );
}

export function VerificationAnalyticsClient() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);

  const { data, isLoading } = useQuery<{ data: AnalyticsData }>({
    queryKey: ["verification-analytics", days],
    queryFn: () => fetch(`/api/admin/verifications/analytics?days=${days}`).then((r) => r.json()),
  });

  const stats = data?.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[var(--text-h1)] font-[800] text-[var(--color-text-heading)]">
            Verification Analytics
          </h1>
          <p className="mt-1 text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            Overview of student verification throughput and moderator performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/verifications"
            className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-link)] hover:underline"
          >
            ← Back to queue
          </Link>
          <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-[var(--text-body-sm)] font-[600] transition-colors duration-[var(--transition-fast)] ${
                  days === r
                    ? "bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]"
                }`}
              >
                Last {r} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading || !stats ? (
        <PageSpinner label="Loading analytics…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FileCheck2}
              iconBg="var(--color-primary-faint)"
              iconColor="var(--color-primary-deep)"
              label="Total Verifications"
              value={stats.totalDecided.toLocaleString()}
            />
            <StatCard
              icon={Timer}
              iconBg="var(--color-secondary-brand-container)"
              iconColor="var(--color-secondary-brand)"
              label="Avg. Processing Time"
              value={
                stats.avgProcessingHours !== null
                  ? <>{stats.avgProcessingHours.toFixed(1)}<span className="text-[1.1rem] font-[600] text-[var(--color-text-muted)]">h</span></>
                  : "—"
              }
            />
            <StatCard
              icon={CheckCircle2}
              iconBg="var(--color-success-bg)"
              iconColor="var(--color-success-text)"
              label="Approval Rate"
              value={stats.approvalRate !== null ? `${stats.approvalRate.toFixed(1)}%` : "—"}
            />
            <StatCard
              icon={Clock}
              iconBg="var(--color-primary-faint)"
              iconColor="var(--color-primary-deep)"
              label="Pending Queue"
              value={<>{stats.pendingCount} <span className="text-[1rem] font-[500] text-[var(--color-text-muted)]">requests</span></>}
              emphasize
            />
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
            <h2 className="mb-1 text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)]">
              Verification Throughput
            </h2>
            <p className="mb-4 text-[var(--text-caption)] text-[var(--color-text-muted)]">
              Daily submissions vs. approvals, last {stats.days} days.
            </p>
            <VerificationThroughputChart data={stats.throughput} />
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
              <h2 className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)]">
                Moderator Performance
              </h2>
            </div>

            {stats.moderatorPerformance.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <ListChecks size={24} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                <p className="max-w-sm text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                  No decisions recorded in this range yet. This table fills in as admins work through the queue.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    {["Moderator", "Total reviews", "Approval rate", "Avg. speed"].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.moderatorPerformance.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--color-border-subtle)] last:border-b-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-faint)] text-[11px] font-[700] text-[var(--color-primary-deep)]">
                            {m.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[var(--text-body-sm)] text-[var(--color-text-body)]">{m.totalReviews}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-body)]">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: m.approvalRate >= 85 ? "var(--color-success)" : "var(--color-error)" }}
                            aria-hidden="true"
                          />
                          {m.approvalRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[var(--text-body-sm)] text-[var(--color-text-body)]">
                        {m.avgHours !== null ? `${m.avgHours.toFixed(1)} hrs` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            Decision-level stats (everything above except the pending count) only cover verifications decided on or after {stats.trackingSince}, when moderator/timing tracking was added.
          </p>
        </>
      )}
    </div>
  );
}
