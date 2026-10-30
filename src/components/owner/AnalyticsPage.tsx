"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, Eye, BarChart3 } from "lucide-react";

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
      className={`relative overflow-hidden rounded-2xl border border-line bg-[rgb(255_255_255_/_0.8)] p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[0.85rem] font-medium text-muted">{label}</span>
          <span className="mt-2 text-[1.75rem] font-semibold leading-none tracking-tight text-ink">
            {value}
          </span>
          {trend && (
            <span className="mt-2 text-[0.8rem] text-brand">{trend}</span>
          )}
        </div>
        <div className="flex-none rounded-xl bg-brand-soft p-3">
          <Icon className="h-5 w-5 text-brand" />
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
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <section
      aria-label="Monthly performance"
      className="mt-6 rounded-2xl border border-line bg-[rgb(255_255_255_/_0.8)] p-6 backdrop-blur-xl"
    >
      <h3 className="m-0 text-[1.1rem] font-semibold text-ink">
        6-Month Performance
      </h3>
      <div className="mt-6 space-y-4">
        {data.map((month) => {
          const bookingHeight = (month.bookings / maxBookings) * 100;
          const revenueHeight = (month.revenue / maxRevenue) * 100;

          return (
            <div key={month.key} className="space-y-2">
              <div className="flex items-center justify-between text-[0.85rem]">
                <span className="font-medium text-ink">{month.label}</span>
                <div className="flex gap-4">
                  <span className="text-muted">
                    {numberFormatter.format(month.bookings)} bookings
                  </span>
                  <span className="text-muted">
                    {currencyFormatter.format(month.revenue)}
                  </span>
                </div>
              </div>
              <div className="relative h-2 rounded-full bg-surface-muted">
                <div
                  className="absolute left-0 top-0 h-2 rounded-full bg-brand transition-all duration-500 ease-out"
                  style={{ width: `${bookingHeight}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
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
    <main className="min-h-screen bg-canvas py-12 md:py-16">
      <div className="mx-auto w-[min(100%-40px,600px)] md:w-[min(1920px,calc(100%-64px))]">
        <header className="mb-8 md:mb-10">
          <h1 className="m-0 text-[clamp(1.7rem,3vw,2.2rem)] font-semibold tracking-[-0.035em] text-ink">
            Analytics
          </h1>
          <p className="mt-2 m-0 text-[0.95rem] text-muted">
            Track your hostel performance and revenue.
          </p>
        </header>

        {isLoading ? (
          <section
            aria-busy="true"
            className="py-8 text-sm text-muted"
            role="status"
          >
            <p className="m-0">Loading analytics...</p>
          </section>
        ) : error ? (
          <section
            className="rounded-2xl border border-[#e7c9c4] bg-surface p-7 text-[#8c2822]"
            role="alert"
          >
            <p className="m-0 text-[0.95rem]">{error}</p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-current bg-transparent px-4 py-2 font-semibold text-current transition-all duration-200 hover:bg-[rgb(236_213_208_/_0.3)] active:scale-[0.97]"
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
            className="rounded-2xl border border-[#e7c9c4] bg-surface p-7 text-[#8c2822]"
            role="alert"
          >
            <p className="m-0 text-[0.95rem]">
              Could not load analytics data. Please try again.
            </p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-current bg-transparent px-4 py-2 font-semibold text-current transition-all duration-200 hover:bg-[rgb(236_213_208_/_0.3)] active:scale-[0.97]"
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
