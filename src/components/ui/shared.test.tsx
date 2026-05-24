import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Search, ShieldCheck } from "lucide-react";
import {
  EmptyState,
  RecoveryNotice,
  TrustCue,
  TrustCueList,
} from "@/components/ui/shared";

describe("shared UI trust and recovery primitives", () => {
  it("renders a trust cue with icon, label, and value", () => {
    const markup = renderToStaticMarkup(
      <TrustCue icon={ShieldCheck} label="Verified" value="Listing checked" />,
    );

    expect(markup).toContain("Verified");
    expect(markup).toContain("Listing checked");
  });

  it("renders multiple trust cues as a labelled list", () => {
    const markup = renderToStaticMarkup(
      <TrustCueList
        ariaLabel="Booking trust signals"
        cues={[
          { icon: ShieldCheck, label: "Payment", value: "Secured by Safepay" },
          { icon: Search, label: "Photos", value: "Uploaded by owner" },
        ]}
      />,
    );

    expect(markup).toContain("Booking trust signals");
    expect(markup).toContain("Secured by Safepay");
    expect(markup).toContain("Uploaded by owner");
  });

  it("renders a recovery notice with primary and secondary actions", () => {
    const markup = renderToStaticMarkup(
      <RecoveryNotice
        tone="warning"
        title="Payment pending"
        message="Your payment is still being verified."
        primaryAction={<a href="/dashboard/bookings">View booking</a>}
        secondaryAction={<button>Find another hostel</button>}
      />,
    );

    expect(markup).toContain("Payment pending");
    expect(markup).toContain("View booking");
    expect(markup).toContain("Find another hostel");
  });

  it("supports compact empty states for dashboard panels and search recovery", () => {
    const markup = renderToStaticMarkup(
      <EmptyState
        icon={Search}
        heading="No hostels match your filters"
        description="Clear filters or search a nearby city."
        compact
      />,
    );

    expect(markup).toContain("No hostels match your filters");
    expect(markup).toContain("py-10");
  });
});
