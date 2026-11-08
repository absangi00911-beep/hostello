// Path: src/lib/email-templates/bank-details-changed.ts
import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton, emailSubject, emailTheme, emailRow } from "./layout";

/**
 * Last four characters only. The full account number never goes into an email,
 * and a value too short for "last four" to hide anything reveals nothing.
 */
export function maskAccountNumber(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "none";
  if (trimmed.length < 8) return "an account on file";
  return `ending ${trimmed.slice(-4)}`;
}

/**
 * Sent to the owner's account email whenever their payout bank details change.
 * Payouts are sent to whatever details are on file, so a silent change would
 * let anyone with brief access to the account redirect the next payout.
 */
export function bankDetailsChangedEmail({
  name, bankName, previousAccount, newAccount, changedAt, resetUrl,
}: {
  name: string;
  bankName: string;
  previousAccount: string | null | undefined;
  newAccount: string;
  changedAt: Date;
  resetUrl: string;
}) {
  const firstName = escapeHtml(name.split(" ")[0]);
  const when = new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi",
  }).format(changedAt);

  const content = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:${emailTheme.heading};">
      Your payout bank details were changed
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:${emailTheme.body};line-height:1.6;">
      Hi ${firstName}, the bank details used to pay out your earnings were just updated.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${emailRow("Bank", escapeHtml(bankName))}
      ${emailRow("Previous account", escapeHtml(maskAccountNumber(previousAccount)))}
      ${emailRow("New account", escapeHtml(newAccount))}
      ${emailRow("Changed", `${escapeHtml(when)} PKT`)}
    </table>
    <p style="margin:0 0 20px;font-size:15px;color:${emailTheme.body};line-height:1.6;">
      If this was you, no action is needed. If it wasn't, someone else may have access to your
      account. Reset your password now and contact HostelLo support before your next payout.
    </p>
    ${emailButton("Reset my password", resetUrl)}
  `;

  return {
    subject: emailSubject("Your HostelLo payout bank details were changed"),
    html: emailLayout(content, "Your payout bank details were changed"),
  };
}
