import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "HostelLo <noreply@hostello.pk>";

/**
 * Escape HTML special characters to prevent injection attacks.
 * Use when interpolating user-supplied data into HTML strings.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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
    console.warn(`[email] Would send to ${to}: "${subject}"`);
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
      console.error("[email] Resend error:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return { success: false, error: err };
  }
}
