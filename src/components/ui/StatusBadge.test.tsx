import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusBadge, bookingStatusTone } from "./StatusBadge";

describe("StatusBadge", () => {
  it("always renders the status as text, not just colour", () => {
    const markup = renderToStaticMarkup(
      <StatusBadge status="cancelled" tone="danger">
        Cancelled
      </StatusBadge>,
    );

    expect(markup).toContain(">Cancelled</span>");
    expect(markup).toContain('data-status="cancelled"');
  });

  it("uses the DESIGN.md status colours with the 8px badge radius", () => {
    const tones = {
      danger: "bg-warn-soft text-danger",
      warning: "bg-warn-soft text-warn-ink",
      info: "bg-brand-soft text-brand-dark",
      neutral: "bg-surface-muted text-muted",
    } as const;

    for (const [tone, classes] of Object.entries(tones)) {
      const markup = renderToStaticMarkup(
        <StatusBadge tone={tone as keyof typeof tones}>Label</StatusBadge>,
      );
      expect(markup).toContain(classes);
      expect(markup).toContain("rounded-md");
      expect(markup).not.toContain("rounded-full");
      expect(markup).not.toMatch(/#[0-9a-f]{6}/i);
    }
  });

  it("omits data-status when no machine status is given", () => {
    expect(renderToStaticMarkup(<StatusBadge tone="info">New</StatusBadge>)).not.toContain(
      "data-status",
    );
  });

  it("maps every booking status to one tone shared by students and owners", () => {
    expect(bookingStatusTone).toEqual({
      PENDING: "warning",
      CONFIRMED: "info",
      COMPLETED: "neutral",
      CANCELLED: "danger",
    });
  });
});
