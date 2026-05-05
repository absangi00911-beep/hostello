/**
 * Price Alert Service
 * 
 * Monitors all active price alerts and notifies users when hostel prices drop below their target.
 */

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { priceAlertEmail } from "@/lib/email-templates/price-alert";

async function checkPriceAlerts(baseUrl: string = "https://hostello.pk") {
  try {
    console.log("[Price Alert] Starting price check...");

    // Fetch all active price alerts with related data
    const alerts = await db.priceAlert.findMany({
      where: { active: true },
      include: {
        user: { select: { id: true, email: true, name: true } },
        hostel: { select: { id: true, name: true, slug: true, pricePerMonth: true } },
      },
    });

    console.log(`[Price Alert] Found ${alerts.length} active alerts to check`);

    let emailsSent = 0;
    const alertsToUpdate: Array<{ id: string; hostelName: string; userEmail: string }> = [];

    // Check each alert
    for (const alert of alerts) {
      const priceDropped = alert.hostel.pricePerMonth < alert.targetPrice;

      if (priceDropped) {
        console.log(
          `[Price Alert] Price drop detected for ${alert.user.email}: ${alert.hostel.name} (${alert.hostel.pricePerMonth} < ${alert.targetPrice})`
        );

        try {
          // Use the last known price if available, otherwise fall back to target price
          // For the first alert, we estimate based on the target
          const oldPrice = alert.lastKnownPrice ?? alert.targetPrice;
          const newPrice = alert.hostel.pricePerMonth;
          const hostelUrl = `${baseUrl}/hostels/${alert.hostel.slug}`;

          const { subject, html } = priceAlertEmail({
            userName: alert.user.name,
            hostelName: alert.hostel.name,
            hostelUrl,
            oldPrice,
            newPrice,
            targetPrice: alert.targetPrice,
          });

          await sendEmail({
            to: alert.user.email,
            subject,
            html,
          });

          emailsSent++;
          alertsToUpdate.push({
            id: alert.id,
            hostelName: alert.hostel.name,
            userEmail: alert.user.email,
          });

          console.log(
            `[Price Alert] Email sent to ${alert.user.email} for ${alert.hostel.name}`
          );
        } catch (err) {
          console.error(
            `[Price Alert] Failed to send email to ${alert.user.email}:`,
            err
          );
        }
      }
    }

    // Deactivate alerts that triggered and update timestamp + lastKnownPrice
    if (alertsToUpdate.length > 0) {
      await db.priceAlert.updateMany({
        where: { id: { in: alertsToUpdate.map((a) => a.id) } },
        data: {
          active: false,
          lastAlertAt: new Date(),
        },
      });

      console.log(
        `[Price Alert] Deactivated ${alertsToUpdate.length} alerts after sending notifications`
      );
    }

    // Update lastKnownPrice for all active alerts (whether they triggered or not)
    // This ensures we always have the latest price for comparison
    // Skip alerts that were just deactivated to avoid unnecessary DB operations
    const deactivatedIds = new Set(
      alertsToUpdate.map((a) => a.id)
    );
    const priceUpdates = alerts
      .filter((alert) => !deactivatedIds.has(alert.id))
      .map((alert) => 
        db.priceAlert.update({
          where: { id: alert.id },
          data: { lastKnownPrice: alert.hostel.pricePerMonth },
        })
    );
    if (priceUpdates.length > 0) {
      await Promise.all(priceUpdates);
    }

    console.log(
      `[Price Alert] Completed: ${emailsSent} emails sent, ${alerts.length - emailsSent} alerts without price drops`
    );
    return { success: true, emailsSent, alertsChecked: alerts.length };
  } catch (err) {
    console.error("[Price Alert] Fatal error:", err);
    throw err;
  }
}

export { checkPriceAlerts };
