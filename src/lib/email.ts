// Path: src/lib/email.ts

import { Resend } from "resend";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { isProductionDeployment } from "@/lib/deployment-env";
export { escapeHtml } from "@hostello/shared";

const FROM = process.env.EMAIL_FROM ?? "HostelLo <noreply@hostello.pk>";
const RESEND_TIMEOUT_MS = 10_000;

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

interface SendEmailDeliveryOptions {
  /** Stable key used for provider-side deduplication on retries. */
  idempotencyKey?: string;
  /** Outbox callers persist only a safe code and must not log provider errors. */
  suppressErrorLogs?: boolean;
}

/**
 * Send a transactional email via Resend.
 *
 * Always awaited server-side. Never call this from a client component.
 * Errors are caught and logged — a failed email never crashes the API route.
 */
export async function sendEmail(
  { to, subject, html }: SendEmailOptions,
  deliveryOptions: SendEmailDeliveryOptions = {},
) {
  // Without a real API key, nothing can be sent. In development that is fine
  // (set RESEND_API_KEY in .env.local to send real emails). In production it is
  // a misconfiguration, and reporting success would hide that every password
  // reset and booking email is being dropped.
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key === "re_placeholder" || !key.startsWith("re_")) {
    if (isProductionDeployment()) {
      if (!deliveryOptions.suppressErrorLogs) {
        console.error("[email] Resend is not configured in production; the message was not sent.");
      }
      return { success: false, error: "Email delivery is unavailable." };
    }
    return { success: true, dev: true };
  }

  try {
    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: "Missing Resend API key." };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);
    let response: Awaited<ReturnType<typeof resend.emails.send>>;
    try {
      response = await resend.emails.send({
        from: FROM,
        to,
        subject,
        html,
      }, {
        signal: controller.signal,
        ...(deliveryOptions.idempotencyKey ? { idempotencyKey: deliveryOptions.idempotencyKey } : {}),
      });
    } finally {
      clearTimeout(timeout);
    }

    const { data, error } = response;

    if (error) {
      if (!deliveryOptions.suppressErrorLogs) {
        console.error("[email] Resend rejected a message:", getSafeErrorSummary(error));
      }
      return { success: false, error: "Email delivery failed." };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    if (!deliveryOptions.suppressErrorLogs) {
      console.error("[email] Unexpected provider error:", getSafeErrorSummary(err));
    }
    return { success: false, error: "Email delivery failed." };
  }
}
