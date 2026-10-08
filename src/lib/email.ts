// Path: src/lib/email.ts

import { Resend } from "resend";
import { getSafeErrorSummary } from "@/lib/safe-error";
export { escapeHtml } from "@hostello/shared";

const FROM = process.env.EMAIL_FROM ?? "HostelLo <noreply@hostello.pk>";

function getResendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key === "re_placeholder" || !key.startsWith("re_")) {
    return null;
  }

  return new Resend(key);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a transactional email via Resend.
 *
 * Always awaited server-side. Never call this from a client component.
 * Errors are caught and logged — a failed email never crashes the API route.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // In development without a real API key, just log instead of sending.
  // Set RESEND_API_KEY in .env.local to send real emails.
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key === "re_placeholder" || !key.startsWith("re_")) {
    return { success: true, dev: true };
  }

  try {
    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: "Missing Resend API key." };
    }

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] Resend rejected a message:", getSafeErrorSummary(error));
      return { success: false, error: "Email delivery failed." };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[email] Unexpected provider error:", getSafeErrorSummary(err));
    return { success: false, error: "Email delivery failed." };
  }
}
