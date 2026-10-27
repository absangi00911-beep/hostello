import { escapeHtml } from "@/lib/email";
import { emailLayout, emailTheme } from "./layout";

export function loginOtpEmail({ code }: { code: string }) {
  const safeCode = escapeHtml(code);
  const content = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:${emailTheme.heading};">
      Your HostelLo login code
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:${emailTheme.body};line-height:1.6;">
      Enter this one-time code to log in or create your account:
    </p>
    <p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:8px;color:${emailTheme.heading};">
      ${safeCode}
    </p>
    <p style="margin:0;font-size:13px;color:${emailTheme.muted};">
      This code expires in 10 minutes. If you didn't request it, you can ignore this email.
    </p>
  `;

  return {
    subject: "Your HostelLo login code",
    html: emailLayout(content, "Your one-time HostelLo login code"),
  };
}
