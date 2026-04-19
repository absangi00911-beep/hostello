import { Resend } from "resend";

// Resend client — created once, reused across all email calls.
// The API key is read from env so it's never in source code.
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "HostelLo <noreply@hostello.pk>";

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
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
    console.log(`[email] Would send to ${to}: "${subject}"`);
    return { success: true, dev: true };
  }

  try {
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
