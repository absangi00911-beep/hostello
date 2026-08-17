"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, TrendingUp, Banknote } from "lucide-react";
import { formatPKR, PageSpinner } from "@/components/ui/shared";

interface AnalyticsData {
  totalViews: number;
  totalRequests: number;
  confirmedBookings: number;
  conversionRate: number;
  totalRevenue: number;
  byMonth: { label: string; bookings: number; revenue: number }[];
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-faint)]">
          <Icon size={16} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
        </div>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">{label}</p>
      </div>
      <p
        className="text-[2rem] font-[700] leading-none text-[var(--color-text-heading)]"

      >
        {value}
      </p>
      {sub && <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  );
}

function BarChart({ data }: { data: AnalyticsData["byMonth"] }) {
  const max = Math.max(...data.map((d) => d.bookings), 1);
  const H = 120; // bar area height px
  const BAR_W = 32;
  const GAP = 16;
  const W = data.length * (BAR_W + GAP) - GAP;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
      <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-muted)] mb-4">
        Booking requests — last 6 months
      </p>
      <svg
        viewBox={`0 0 ${W} ${H + 28}`}
        width="100%"
        aria-label="Bar chart of booking requests over the last 6 months"
        role="img"
      >
        {data.map((d, i) => {
          const barH = Math.max(4, (d.bookings / max) * H);
          const x = i * (BAR_W + GAP);
          const y = H - barH;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx="4"
                fill="var(--color-primary)"
                opacity="0.85"
              />
              {d.bookings > 0 && (
                <text
                  x={x + BAR_W / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--color-text-muted)"
                  fontFamily="var(--font-body)"
                >
                  {d.bookings}
                </text>
              )}
              <text
                x={x + BAR_W / 2}
                y={H + 18}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-text-muted)"
                fontFamily="var(--font-body)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function OwnerAnalyticsPage() {
  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ["owner-analytics"],
    queryFn: () => fetch("/api/owner/analytics").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !data) {
    return <p className="text-[var(--color-text-muted)]">Failed to load analytics.</p>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total views"
          value={data.totalViews.toLocaleString("en-PK")}
          sub="across all your listings"
          icon={Eye}
        />
        <StatCard
          label="Conversion rate"
          value={`${data.conversionRate}%`}
          sub={`${data.confirmedBookings} of ${data.totalRequests} requests confirmed`}
          icon={TrendingUp}
        />
        <StatCard
          label="Total revenue"
          value={formatPKR(data.totalRevenue)}
          sub="from paid bookings"
          icon={Banknote}
        />
      </div>

      {/* Bar chart */}
      {data.byMonth.length > 0 && <BarChart data={data.byMonth} />}
    </div>
  );
}
