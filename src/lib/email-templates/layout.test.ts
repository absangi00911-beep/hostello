import { describe, expect, it } from "vitest";
import { emailButton, emailLayout, emailRow, emailTheme } from "./layout";
import { priceAlertEmail } from "./price-alert";

describe("email design tokens", () => {
  it("uses the current HostelLo palette in the shared email shell", () => {
    const html = emailLayout("<p>Content</p>");

    expect(html).toContain(`background:${emailTheme.page}`);
    expect(html).toContain(`background:${emailTheme.card}`);
    expect(html).toContain(`color:${emailTheme.link}`);
    expect(html).not.toContain("#FAF7F0");
    expect(html).not.toContain("#0D3B2E");
  });

  it("uses shared colors for email actions and detail rows", () => {
    expect(emailButton("Continue", "https://hostello.pk")).toContain(
      `background:${emailTheme.action}`,
    );
    expect(emailRow("Hostel", "Example")).toContain(
      `color:${emailTheme.heading}`,
    );
  });

  it("keeps price changes distinct from the brand accent", () => {
    const { html } = priceAlertEmail({
      userName: "Student",
      hostelName: "Example Hostel",
      hostelUrl: "https://hostello.pk/hostels/example",
      oldPrice: 10000,
      newPrice: 9000,
      targetPrice: 9500,
      unsubscribeUrl: "https://hostello.pk/unsubscribe",
    });

    expect(html).toContain(`color:${emailTheme.success}`);
    expect(html).toContain(`color:${emailTheme.action}`);
    expect(html).not.toContain("#27ae60");
    expect(html).not.toContain("#3498db");
  });
});
