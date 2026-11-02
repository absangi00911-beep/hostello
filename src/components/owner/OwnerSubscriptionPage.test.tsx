import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  OwnerSubscriptionContent,
  type OwnerSubscriptionContentProps,
} from "./OwnerSubscriptionPage";

const base: OwnerSubscriptionContentProps = {
  isLoading: false,
  loadError: null,
  data: { plan: "FREE", subscription: null, listingCount: 1 },
  returnState: null,
  isUpgrading: false,
  upgradeError: null,
  onRetry: vi.fn(),
  onUpgrade: vi.fn(),
};

const render = (overrides: Partial<OwnerSubscriptionContentProps> = {}) =>
  renderToStaticMarkup(<OwnerSubscriptionContent {...base} {...overrides} />);

describe("OwnerSubscriptionContent", () => {
  it("shows a loading state", () => {
    expect(render({ isLoading: true, data: null })).toContain("Loading subscription...");
  });

  it("shows the error with a retry button", () => {
    const markup = render({ data: null, loadError: "Forbidden" });
    expect(markup).toContain("Forbidden");
    expect(markup).toContain("Try again");
  });

  it("offers the upgrade to free owners and shows listing usage", () => {
    const markup = render();
    expect(markup).toContain("1 of 1 included listing used.");
    expect(markup).toContain("Upgrade to Pro for");
    expect(markup).toContain("Unlimited listings");
  });

  it("hides the upgrade button for Pro owners and shows the period end", () => {
    const markup = render({
      data: {
        plan: "PRO",
        subscription: {
          status: "ACTIVE",
          startDate: "2026-10-01T00:00:00.000Z",
          endDate: "2026-11-01T00:00:00.000Z",
        },
        listingCount: 4,
      },
    });
    expect(markup).not.toContain("Upgrade to Pro for");
    expect(markup).toContain("Current period ends");
    expect(markup).toContain("4 listings (no limit on Pro).");
  });

  it("says activation is pending when the owner returns before the webhook", () => {
    const markup = render({ returnState: "upgraded" });
    expect(markup).toContain("waiting for the payment confirmation");
    expect(markup).toContain("Check again");
  });

  it("confirms activation once the plan is Pro", () => {
    const markup = render({
      returnState: "upgraded",
      data: { plan: "PRO", subscription: null, listingCount: 1 },
    });
    expect(markup).toContain("Payment received. Your Pro plan is active.");
  });

  it("notes a cancelled checkout and surfaces upgrade errors", () => {
    const markup = render({ returnState: "cancelled", upgradeError: "Too many checkout attempts." });
    expect(markup).toContain("you weren&#x27;t charged");
    expect(markup).toContain("Too many checkout attempts.");
  });
});
