/** Register or update Hostello's recurring jobs in Upstash QStash. */

import { Client } from "@upstash/qstash";
import { CRON_SCHEDULES } from "../src/lib/cron-schedules";

const qstashToken = process.env.QSTASH_TOKEN;
const qstashUrl = process.env.QSTASH_URL;
const cronSecret = process.env.CRON_SECRET;
const appUrl = (process.env.APP_URL || "https://hostello.pk").replace(/\/+$/, "");

async function scheduleJobs() {
  if (!qstashToken) throw new Error("QSTASH_TOKEN environment variable is required");
  if (!cronSecret) throw new Error("CRON_SECRET environment variable is required");

  const parsedAppUrl = new URL(appUrl);
  if (parsedAppUrl.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS so QStash can securely call the app");
  }

  const client = new Client({
    token: qstashToken,
    ...(qstashUrl ? { baseUrl: qstashUrl } : {}),
    enableTelemetry: false,
  });
  let failedJobs = 0;

  console.log("Scheduling Hostello's QStash cron jobs");
  console.log(`App URL: ${appUrl}`);

  for (const [name, job] of Object.entries(CRON_SCHEDULES)) {
    const destination = new URL(job.endpoint, `${appUrl}/`).toString();
    const scheduleId = `hostello-${name}`;

    try {
      const result = await client.schedules.create({
        scheduleId,
        destination,
        cron: job.cron,
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
      });

      console.log(`✓ ${name}: ${job.cron} UTC → ${destination} (${result.scheduleId})`);
    } catch (error) {
      failedJobs += 1;
      const errorName = error instanceof Error ? error.name : "UnknownError";
      console.error(`✗ ${name}: schedule registration failed (${errorName})`);
    }
  }

  if (failedJobs > 0) {
    throw new Error(`${failedJobs} of ${Object.keys(CRON_SCHEDULES).length} cron schedules failed`);
  }

  console.log(`All ${Object.keys(CRON_SCHEDULES).length} cron schedules are registered.`);
  console.log("Confirm the schedules and recent deliveries in the Upstash QStash console.");
}

scheduleJobs().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Cron schedule registration failed");
  process.exitCode = 1;
});
