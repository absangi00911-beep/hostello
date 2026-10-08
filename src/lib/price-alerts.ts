/**
 * Price Alert Service
 * Checks active alerts in bounded batches and sends email when a hostel price
 * falls below the configured threshold.
 */

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { priceAlertEmail } from "@/lib/email-templates/price-alert";
import { createEmailUnsubscribeToken } from "@/lib/email-unsubscribe-token";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { logOperationalEvent, type OperationalLogContext } from "@/lib/operational-logger";

const BATCH_SIZE = 100;

async function checkPriceAlerts(
  baseUrl = "https://hostello.pk",
  logContext?: OperationalLogContext,
) {
  try {
    let cursor: string | undefined;
    let alertsChecked = 0;
    let emailsSent = 0;
    let skipped = 0;
    let failed = 0;

    while (true) {
      const alerts = await db.priceAlert.findMany({
        where: {
          active: true,
          hostel: { is: { status: "ACTIVE" } },
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
        include: {
          user: { select: { id: true, email: true, name: true, emailNotifications: true } },
          hostel: { select: { id: true, name: true, slug: true, pricePerMonth: true } },
        },
      });

      if (alerts.length === 0) break;
      alertsChecked += alerts.length;
      cursor = alerts[alerts.length - 1].id;

      for (const alert of alerts) {
        const currentPrice = alert.hostel.pricePerMonth;
        const priceDropped = currentPrice < alert.targetPrice;

        if (priceDropped && alert.user.emailNotifications !== false) {
          try {
            const oldPrice = alert.lastKnownPrice ?? alert.targetPrice;
            const host = baseUrl.replace(/\/+$/, "");
            const unsubscribeUrl = `${host}/api/alerts/unsubscribe?token=${encodeURIComponent(alert.unsubscribeToken)}`;
            const unsubscribeSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
            const emailPreferencesUrl = unsubscribeSecret
              ? `${host}/api/email/unsubscribe?token=${encodeURIComponent(
                  createEmailUnsubscribeToken(alert.user.id, alert.user.email, unsubscribeSecret),
                )}`
              : undefined;

            const { subject, html } = priceAlertEmail({
              userName: alert.user.name,
              hostelName: alert.hostel.name,
              hostelUrl: `${host}/hostels/${encodeURIComponent(alert.hostel.slug)}`,
              oldPrice,
              newPrice: currentPrice,
              targetPrice: alert.targetPrice,
              unsubscribeUrl,
              emailPreferencesUrl,
            });

            const delivery = await sendEmail({ to: alert.user.email, subject, html });
            if (!delivery.success) {
              failed++;
              logOperationalEvent("warn", "notification.email.dispatch_failed", {
                notification_type: "PRICE_ALERT",
                reason: "provider_rejected",
              }, logContext);
              // Preserve the last known price so a retry reports the actual drop.
              continue;
            }

            // Persist immediately after a successful provider response instead
            // of waiting for the entire job. This limits duplicate sends if a
            // later batch fails. Durable provider idempotency still needs an outbox.
            await db.priceAlert.updateMany({
              where: { id: alert.id, active: true },
              data: { active: false, lastAlertAt: new Date(), lastKnownPrice: currentPrice },
            });
            emailsSent++;
            continue;
          } catch (error) {
            failed++;
            const summary = getSafeErrorSummary(error);
            logOperationalEvent("error", "notification.email.dispatch_failed", {
              notification_type: "PRICE_ALERT",
              error_name: summary.name,
              ...(summary.code ? { error_code: summary.code } : {}),
              ...(summary.status ? { error_status: summary.status } : {}),
            }, logContext);
            // Keep lastKnownPrice unchanged so the next scheduled run can retry
            // with the previous price as context.
            continue;
          }
        }

        if (priceDropped && alert.user.emailNotifications === false) skipped++;

        // Continue tracking price movement for active alerts that did not send.
        await db.priceAlert.updateMany({
          where: { id: alert.id, active: true },
          data: { lastKnownPrice: currentPrice },
        });
      }

      if (alerts.length < BATCH_SIZE) break;
    }

    return { success: true, emailsSent, alertsChecked, skipped, failed };
  } catch (error) {
    const summary = getSafeErrorSummary(error);
    logOperationalEvent("error", "notification.email.scan_failed", {
      error_name: summary.name,
      ...(summary.code ? { error_code: summary.code } : {}),
      ...(summary.status ? { error_status: summary.status } : {}),
    }, logContext);
    throw error;
  }
}

export { checkPriceAlerts };
