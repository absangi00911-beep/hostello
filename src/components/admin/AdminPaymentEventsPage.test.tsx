import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminPaymentEventsContent,
  RetryForm,
  type AdminPaymentEventsContentProps,
} from "./AdminPaymentEventsPage";
import type { AdminPaymentEvent } from "./adminPaymentEvents";

const event = (overrides: Partial<AdminPaymentEvent> = {}): AdminPaymentEvent => ({
  id: "e1",
  eventType: "payment.succeeded",
  merchantOrderId: "order_1",
  tracker: "track_1",
  providerState: "PAID",
  amountMinorUnits: 2500000,
  currency: "PKR",
  status: "RETRYABLE",
  processingAttempts: 3,
  lastErrorCode: "qstash_delivery_exhausted",
  receivedAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:05:00.000Z",
  replays: [],
  ...overrides,
});

const base: AdminPaymentEventsContentProps = {
  events: [],
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadError: null,
  moreError: null,
  notice: null,
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
  onRetryEvent: vi.fn(),
};

const render = (overrides: Partial<AdminPaymentEventsContentProps> = {}) =>
  renderToStaticMarkup(<AdminPaymentEventsContent {...base} {...overrides} />);

describe("AdminPaymentEventsContent", () => {
  it("states the hourly retry limit", () => {
    expect(render()).toContain("5 retries an hour");
  });

  it("shows loading, error and empty states", () => {
    expect(render({ isLoading: true })).toContain("Loading payment events...");
    const error = render({ loadError: "Forbidden" });
    expect(error).toContain("Forbidden");
    expect(error).toContain("Try again");
    expect(render()).toContain("No payment events need attention.");
  });

  it("shows a retryable event with its evidence and a retry action", () => {
    const markup = render({ events: [event()], total: 1 });
    expect(markup).toContain("Payment succeeded");
    expect(markup).toContain("Can be retried");
    expect(markup).toContain("order_1");
    expect(markup).toContain("track_1");
    expect(markup).toContain("Delivery to the processing queue failed");
    expect(markup).toContain("Retry processing");
  });

  it("offers no retry for events that need reconciliation", () => {
    const markup = render({
      events: [event({ status: "RECONCILIATION_REQUIRED" })],
      total: 1,
    });
    expect(markup).toContain("Needs reconciliation");
    expect(markup).toContain("manual reconciliation in Safepay");
    expect(markup).not.toContain("Retry processing");
  });

  it("offers no retry when the stored evidence is invalid", () => {
    const markup = render({
      events: [event({ lastErrorCode: "invalid_stored_event" })],
      total: 1,
    });
    expect(markup).not.toContain("Retry processing");
  });

  it("lists recent retries", () => {
    const markup = render({
      events: [
        event({
          replays: [
            {
              adminUserId: "a1",
              providerTracker: "track_1",
              reason: "Checked in Safepay, settled.",
              createdAt: "2026-11-01T11:00:00.000Z",
            },
          ],
        }),
      ],
      total: 1,
    });
    expect(markup).toContain("Recent retries");
    expect(markup).toContain("Checked in Safepay, settled.");
  });

  it("shows load more and a notice", () => {
    const markup = render({
      events: [event()],
      total: 40,
      hasMore: true,
      notice: { tone: "success", text: "Retry queued." },
    });
    expect(markup).toContain("Load more");
    expect(markup).toContain("Retry queued.");
  });
});

describe("RetryForm", () => {
  const form = (error: string | null = null) =>
    renderToStaticMarkup(
      <RetryForm
        busy={false}
        error={error}
        event={event()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

  it("asks for the tracker, a reason and a Safepay check", () => {
    const markup = form();
    expect(markup).toContain("Safepay tracker");
    expect(markup).toContain("Reason");
    expect(markup).toContain("I checked this payment in Safepay.");
    expect(markup).toContain("cannot be edited later");
    expect(markup).toContain("disabled");
  });

  it("shows an API error", () => {
    expect(form("QStash did not accept the retry.")).toContain(
      "QStash did not accept the retry.",
    );
  });
});
