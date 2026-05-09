/**
 * Price Alert Cron Job
 *
 * Monitors all active price alerts and notifies users when hostel prices drop below their target.
 * Run frequency: Every 6 hours (recommended to avoid email spam)
 *
 * Can be run manually:
 *   npx tsx scripts/check-price-alerts.ts
 *
 * Or via API endpoint (from QStash):
 *   POST /api/cron/check-price-alerts
 */

import { checkPriceAlerts } from "@/lib/price-alerts";
import { fileURLToPath } from "url";

// ESM-safe equivalent of `if (require.main === module)`.
// tsx executes this file directly, so import.meta.url matches process.argv[1].
const isMain =
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1]?.endsWith("check-price-alerts.ts");

if (isMain) {
  const baseUrl = process.env.APP_URL || "https://hostello.pk";

  checkPriceAlerts(baseUrl)
    .then((result) => {
      console.log("[Price Alert Script] Result:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Price Alert Script] Error:", err);
      process.exit(1);
    });
}

export { checkPriceAlerts };