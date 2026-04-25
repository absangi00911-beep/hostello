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
          // Get previous price from history if available (or use the alert creation as baseline)
          const oldPrice = alert.targetPrice; // Use target as approximate old price
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

    // Deactivate alerts that triggered and update timestamp
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
