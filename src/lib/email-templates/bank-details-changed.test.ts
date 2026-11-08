import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/app-url", () => ({ getAppUrl: () => "https://hostello.test" }));

import { bankDetailsChangedEmail, maskAccountNumber } from "./bank-details-changed";

describe("maskAccountNumber", () => {
  it("shows only the last four characters", () => {
    expect(maskAccountNumber("PK00HABB0000000011111111")).toBe("ending 1111");
    expect(maskAccountNumber("  0300-1234567  ")).toBe("ending 4567");
  });

  it("reveals nothing for values too short to mask", () => {
    expect(maskAccountNumber("1")).toBe("an account on file");
    expect(maskAccountNumber("1234567")).toBe("an account on file");
    expect(maskAccountNumber("12345678")).toBe("ending 5678");
  });

  it("says none when nothing is on file", () => {
    expect(maskAccountNumber(null)).toBe("none");
    expect(maskAccountNumber(undefined)).toBe("none");
    expect(maskAccountNumber("   ")).toBe("none");
  });
});

describe("bankDetailsChangedEmail", () => {
  const base = {
    name: "Jane Owner",
    bankName: "HBL",
    previousAccount: "PK00HABB0000000011111111",
    newAccount: "ending 9999",
    changedAt: new Date("2026-11-08T10:00:00Z"),
    resetUrl: "https://hostello.test/forgot-password",
  };

  it("has a fixed, plain-text subject and a reset link", () => {
    const email = bankDetailsChangedEmail(base);

    expect(email.subject).toBe("Your HostelLo payout bank details were changed");
    expect(email.html).toContain("https://hostello.test/forgot-password");
    expect(email.html).toContain("PKT");
  });

  it("escapes user-controlled values", () => {
    const email = bankDetailsChangedEmail({ ...base, name: "<b>Jane</b> Owner", bankName: "<script>x</script>" });

    expect(email.html).not.toContain("<script>x</script>");
    expect(email.html).not.toContain("<b>Jane</b>");
  });

  it("never contains a full account number", () => {
    const email = bankDetailsChangedEmail(base);

    expect(email.html).not.toContain("PK00HABB0000000011111111");
    expect(email.html).toContain("ending 1111");
  });
});
