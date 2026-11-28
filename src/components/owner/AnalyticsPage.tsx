"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Eye,
  DollarSign,
  BarChart3,
} from "@/components/icons/HostelloIcons";

interface AnalyticsData {
  totalViews: number;
  totalRequests: number;
  confirmedBookings: number;
  conversionRate: number;
  totalRevenue: number;
  byMonth: Array<{
    key: string;
    label: string;
    bookings: number;
    revenue: number;
  }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAnalytics(value: unknown): AnalyticsData | null {
  if (
    !isRecord(value) ||
    typeof value.totalViews !== "number" ||
    typeof value.totalRequests !== "number" ||
    typeof value.confirmedBookings !== "number" ||
    typeof value.conversionRate !== "number" ||
    typeof value.totalRevenue !== "number" ||
    !Array.isArray(value.byMonth)
  ) {
    return null;
  }

  const byMonth = value.byMonth.map((month: unknown) => {
    if (
      !isRecord(month) ||
      typeof month.key !== "string" ||
      typeof month.label !== "string" ||
      typeof month.bookings !== "number" ||
      typeof month.revenue !== "number"
    ) {
      return null;
    }
    return {
      key: month.key,
      label: month.label,
      bookings: month.bookings,
      revenue: month.revenue,
    };
  });

  if (byMonth.some((m) => m === null)) {
    return null;
  }

  return {
    totalViews: value.totalViews,
    totalRequests: value.totalRequests,
    confirmedBookings: value.confirmedBookings,
    conversionRate: value.conversionRate,
    totalRevenue: value.totalRevenue,
    byMonth: byMonth as AnalyticsData["byMonth"],
  };
}

function readApiError(value: unknown): string | null {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : null;
}

async function loadAnalytics(signal: AbortSignal): Promise<AnalyticsData> {
  const response = await fetch("/api/owner/analytics", { signal });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(readApiError(payload) ?? "Could not load analytics data.");
  }

  const analytics = parseAnalytics(payload);
  if (!analytics) {
    throw new Error("The analytics response was invalid. Please try again.");
  }

  return analytics;
}

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-PK");

function MetricsCard({
  icon: Icon,
  label,
  value,
  trend,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: string;
  className?: string;
}) {
  return (
    <article
      className={`rounded-xl border border-line bg-surface p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-label font-medium text-muted">{label}</span>
          <span className="mt-2 text-headline font-bold leading-tight tabular-nums text-ink">
            {value}
          </span>
          {trend && (
            <span className="mt-2 text-label text-brand">{trend}</span>
          )}
        </div>
        <div aria-hidden="true" className="flex-none rounded-lg bg-brand-soft p-2.5">
          <Icon className="h-5 w-5 text-brand-dark" />
        </div>
      </div>
    </article>
  );
}

function MonthlyChart({
  data,
}: {
  data: AnalyticsData["byMonth"];
}) {
  const maxBookings = Math.max(...data.map((d) => d.bookings), 1);
  const hasActivity = data.some((d) => d.bookings > 0 || d.revenue > 0);

  return (
    <section
      aria-labelledby="monthly-performance-title"
      className="mt-6 rounded-xl border border-line bg-surface p-5 md:p-6"
    >
      <h2
        className="m-0 text-title font-semibold text-ink"
        id="monthly-performance-title"
      >
        Monthly performance
      </h2>
      <p className="mt-1 mb-0 max-w-prose text-label text-muted">
        {hasActivity
          ? "Bookings and revenue for each of the last months. Bar length compares bookings with your busiest month."
          : "No bookings or revenue in this period yet."}
      </p>
      <table className="mt-4 w-full border-collapse text-left text-label">
        <caption className="sr-only">
          Bookings and revenue by month
        </caption>
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 pr-3 font-semibold" scope="col">
              Month
            </th>
            <th className="px-3 py-2 text-right font-semibold" scope="col">
              Bookings
            </th>
            <th className="px-3 py-2 text-right font-semibold" scope="col">
              Revenue
            </th>
            <th className="hidden w-[35%] py-2 pl-3 sm:table-cell" scope="col">
              <span className="sr-only">Bookings compared with busiest month</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((month) => (
            <tr className="border-b border-line last:border-b-0" key={month.key}>
              <th className="py-3 pr-3 font-medium text-ink" scope="row">
                {month.label}
              </th>
              <td className="px-3 py-3 text-right tabular-nums text-ink">
                {numberFormatter.format(month.bookings)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-ink">
                {currencyFormatter.format(month.revenue)}
              </td>
              <td aria-hidden="true" className="hidden py-3 pl-3 sm:table-cell">
                <div className="relative h-2 rounded-full bg-surface-muted">
                  <div
                    className="absolute left-0 top-0 h-2 rounded-full bg-brand transition-all duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${(month.bookings / maxBookings) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function AnalyticsPageContent({
  analytics,
  error,
  isLoading,
  onRetry,
}: {
  analytics: AnalyticsData | null;
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
}) {
  return (
    <main id="main-content" className="min-h-dvh bg-canvas py-12 md:py-16">
      <div className="mx-auto w-[min(calc(100%-var(--page-gutter-mobile)),600px)] md:w-[min(1920px,calc(100%-var(--page-gutter-total)))]">
        <header className="mb-8 md:mb-10">
          <h1 className="m-0 text-display font-semibold tracking-[-0.035em] text-ink">
            Analytics
          </h1>
          <p className="mt-2 m-0 text-body text-muted">
            Track your hostel performance and revenue.
          </p>
        </header>

        {isLoading ? (
          <section
            aria-busy="true"
            className="py-8 text-label text-muted"
            role="status"
          >
            <p className="m-0">Loading analytics...</p>
          </section>
        ) : error ? (
          <section
            className="rounded-xl border border-danger bg-surface p-6 text-danger"
            role="alert"
          >
            <p className="m-0 text-body">{error}</p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-current bg-transparent px-4 py-2 font-semibold text-current btn-secondary"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          </section>
        ) : analytics ? (
          <>
            <section
              aria-label="Key metrics"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              <MetricsCard
                icon={Eye}
                label="Total Views"
                value={numberFormatter.format(analytics.totalViews)}
              />
              <MetricsCard
                icon={Users}
                label="Booking Requests"
                value={numberFormatter.format(analytics.totalRequests)}
              />
              <MetricsCard
                icon={TrendingUp}
                label="Confirmed Bookings"
                value={numberFormatter.format(analytics.confirmedBookings)}
              />
              <MetricsCard
                icon={BarChart3}
                label="Conversion Rate"
                value={`${analytics.conversionRate.toFixed(1)}%`}
              />
              <MetricsCard
                icon={DollarSign}
                label="Total Revenue"
                value={currencyFormatter.format(analytics.totalRevenue)}
                className="md:col-span-2 lg:col-span-1"
              />
            </section>

            <MonthlyChart data={analytics.byMonth} />
          </>
        ) : (
          <section
            className="rounded-xl border border-danger bg-surface p-6 text-danger"
            role="alert"
          >
            <p className="m-0 text-body">
              Could not load analytics data. Please try again.
            </p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-current bg-transparent px-4 py-2 font-semibold text-current btn-secondary"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void loadAnalytics(controller.signal)
      .then(setAnalytics)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load analytics data. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  return (
    <AnalyticsPageContent
      analytics={analytics}
      error={error}
      isLoading={isLoading}
      onRetry={() => setRetryCount((count) => count + 1)}
    />
  );
}
