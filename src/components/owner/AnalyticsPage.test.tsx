import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalyticsPageContent } from "@/components/owner/AnalyticsPage";

const analytics = {
  totalViews: 125,
  totalRequests: 12,
  confirmedBookings: 8,
  conversionRate: 66.7,
  totalRevenue: 120_000,
  byMonth: [
    { key: "2026-10", label: "Oct", bookings: 8, revenue: 120_000 },
  ],
};

describe("AnalyticsPageContent", () => {
  it("keeps informational metric cards free of pointer affordances and motion", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsPageContent
        analytics={analytics}
        error={null}
        isLoading={false}
        onRetry={() => {}}
      />,
    );
    const cards = [...markup.matchAll(/<article class="([^"]*)">/g)];

    expect(cards).toHaveLength(5);
    for (const [, className] of cards) {
      expect(className).not.toMatch(
        /(?:transition|hover:|active:|cursor-pointer)/,
      );
    }
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain('role="button"');
  });

  it("gives chart data a table alternative instead of bars alone", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsPageContent
        analytics={analytics}
        error={null}
        isLoading={false}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain("<table");
    expect(markup).toContain("<caption");
    expect(markup).toContain('scope="col"');
    expect(markup).toContain('<th class="py-3 pr-3 font-medium text-ink" scope="row">Oct</th>');
    const revenue = new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(120_000);
    expect(markup).toContain(`>${revenue}</td>`);
    expect(markup).toContain('aria-labelledby="monthly-performance-title"');
  });

  it("uses flat solid surfaces rather than translucent blurred cards", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsPageContent
        analytics={analytics}
        error={null}
        isLoading={false}
        onRetry={() => {}}
      />,
    );

    expect(markup).not.toContain("backdrop-blur");
    expect(markup).not.toContain("rgb(255_255_255_/_0.8)");
  });

  it("says plainly when the period has no activity", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsPageContent
        analytics={{
          ...analytics,
          byMonth: [{ key: "2026-10", label: "Oct", bookings: 0, revenue: 0 }],
        }}
        error={null}
        isLoading={false}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain("No bookings or revenue in this period yet.");
  });

  it("disables monthly-bar transition for reduced-motion users", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsPageContent
        analytics={analytics}
        error={null}
        isLoading={false}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain("transition-all duration-500 ease-out");
    expect(markup).toContain("motion-reduce:transition-none");
  });

  it("uses semantic danger styling for retryable analytics errors", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsPageContent
        analytics={null}
        error="Could not load analytics data."
        isLoading={false}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("border-danger");
    expect(markup).toContain("text-danger");
    expect(markup).toContain("Could not load analytics data.");
    expect(markup).toContain(">Try again</button>");
    expect(markup).not.toContain("#e7c9c4");
    expect(markup).not.toContain("#8c2822");
  });

  it("uses the same semantic danger styling for the fallback analytics error", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsPageContent
        analytics={null}
        error={null}
        isLoading={false}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("border-danger");
    expect(markup).toContain("text-danger");
    expect(markup).toContain("Could not load analytics data. Please try again.");
    expect(markup).toContain(">Try again</button>");
    expect(markup).not.toContain("#e7c9c4");
    expect(markup).not.toContain("#8c2822");
  });
});
