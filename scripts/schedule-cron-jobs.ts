/**
 * Schedule Upstash QStash cron jobs
 *
 * This script creates recurring jobs in Upstash QStash for:
 * 1. Mark Completed Stays - Daily at 00:00 UTC
 * 2. Cancel Abandoned Payments - Every 5 minutes
 * 3. Check Price Alerts - Every 6 hours
 */

import { Client } from "@upstash/qstash";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || "https://qstash-us-east-1.upstash.io";
const APP_URL = process.env.APP_URL || "https://hostello.pk";
const CRON_SECRET = process.env.CRON_SECRET || "default-secret";

if (!QSTASH_TOKEN) {
  throw new Error("QSTASH_TOKEN environment variable is required");
}

interface JobConfig {
  name: string;
  schedule: string;
  endpoint: string;
  description: string;
}

const jobs: JobConfig[] = [
  {
    name: "mark-completed-stays",
    schedule: "0 0 * * *", // Daily at 00:00 UTC
    endpoint: "/api/cron/mark-completed-stays",
    description: "Mark bookings as completed after checkout",
  },
  {
    name: "cancel-abandoned-payments",
    schedule: "*/5 * * * *", // Every 5 minutes
    endpoint: "/api/cron/cancel-abandoned-payments",
    description: "Cancel bookings stuck in PENDING for 30+ minutes",
  },
  {
    name: "check-price-alerts",
    schedule: "0 0 */6 * * *", // Every 6 hours (0 0 */6 * * UTC)
    endpoint: "/api/cron/check-price-alerts",
    description: "Check price alerts and send notifications",
  },
];

async function scheduleJobs() {
  console.log("🔄 Scheduling Upstash QStash cron jobs...\n");
  console.log(`App URL: ${APP_URL}\n`);

  if (!QSTASH_TOKEN) {
    console.error("❌ QSTASH_TOKEN not set in environment variables");
    process.exit(1);
  }

  const client = new Client({
    token: QSTASH_TOKEN,
    baseUrl: QSTASH_URL,
  });

  for (const job of jobs) {
    try {
      const url = `${APP_URL}${job.endpoint}`;

      console.log(`Scheduling ${job.name}...`);
      console.log(`  Destination: ${url}`);
      console.log(`  Cron: ${job.schedule}`);

      // Try using the publishJSON method which might handle scheduling
      // QStash SDK might not have a direct schedules method, try raw fetch instead
      const response = await fetch(`${QSTASH_URL}/v2/schedules`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${QSTASH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: url,
          cron: job.schedule,
          method: "POST",
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);

      console.log(`✅ ${job.name}`);
      console.log(`   Schedule: ${job.schedule}`);
      console.log(`   Description: ${job.description}\n`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("409") || error.message.includes("already")) {
          console.log(`✅ ${job.name} (already scheduled)\n`);
        } else {
          console.error(`❌ Failed to schedule ${job.name}:`);
          console.error(`   Error: ${error.message}\n`);
        }
      } else {
        console.error(`❌ Unexpected error scheduling ${job.name}:`, error);
      }
    }
  }

  console.log("📋 Job scheduling complete!");
  console.log("\n✨ Next steps:");
  console.log("1. Go to https://console.upstash.com/qstash");
  console.log("2. Click 'Schedules' to verify all jobs are listed");
  console.log("3. Monitor 'Requests' tab to see execution logs");
}

scheduleJobs().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
