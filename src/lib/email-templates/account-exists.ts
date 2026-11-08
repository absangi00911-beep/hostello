// Path: src/lib/email-templates/account-exists.ts
import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton, emailTheme } from "./layout";

/**
 * Sent when someone tries to sign up with an address that already has an
 * account. The signup response is identical either way, so this email is the
 * only place the real owner of the address learns about it.
 */
export function accountExistsEmail({
  name, loginUrl, resetUrl,
}: {
  name: string; loginUrl: string; resetUrl: string;
}) {
  const firstName = escapeHtml(name.split(" ")[0]);

  const content = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:${emailTheme.heading};">
      You already have a HostelLo account
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:${emailTheme.body};line-height:1.6;">
      Hi ${firstName}, someone just tried to create a HostelLo account with this
      email address. If that was you, you don't need a new account. Log in instead.
    </p>
    ${emailButton("Log in", loginUrl)}
    <p style="margin:24px 0 0;font-size:13px;color:${emailTheme.muted};line-height:1.6;">
      Forgot your password? <a href="${escapeHtml(resetUrl)}" style="color:${emailTheme.muted};">Reset it here</a>.
      If this wasn't you, you can ignore this email. Nothing about your account has changed.
    </p>
  `;

  return {
    subject: "You already have a HostelLo account",
    html:    emailLayout(content, "You already have a HostelLo account"),
  };
}
