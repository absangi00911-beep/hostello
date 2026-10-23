/**
 * Source of truth for QStash schedules and cron health freshness thresholds.
 * Keep scheduler setup and the health endpoint backed by the same entries.
 */
export const CRON_SCHEDULES = {
  "cancel-abandoned-payments": {
    cron: "*/5 * * * *",
    endpoint: "/api/cron/cancel-abandoned-payments",
    maxAgeMs: 10 * 60 * 1000,
    label: "Cancel abandoned payments",
    description: "Cancel bookings stuck in PENDING for 30+ minutes",
  },
  "expire-unanswered-bookings": {
    cron: "*/15 * * * *",
    endpoint: "/api/cron/expire-unanswered-bookings",
    maxAgeMs: 30 * 60 * 1000,
    label: "Expire unanswered bookings",
    description: "Remind owners and cancel paid requests they do not answer within 24 hours",
  },
  "check-price-alerts": {
    cron: "0 */6 * * *",
    endpoint: "/api/cron/check-price-alerts",
    maxAgeMs: 8 * 60 * 60 * 1000,
    label: "Check price alerts",
    description: "Check price alerts and send notifications",
  },
  "cleanup-tokens": {
    cron: "0 1 * * *",
    endpoint: "/api/cron/cleanup-tokens",
    maxAgeMs: 26 * 60 * 60 * 1000,
    label: "Cleanup expired tokens",
    description: "Delete expired or used password reset and verification tokens",
  },
  "cleanup-verification-uploads": {
    cron: "0 * * * *",
    endpoint: "/api/cron/cleanup-verification-uploads",
    maxAgeMs: 2 * 60 * 60 * 1000,
    label: "Cleanup abandoned verification uploads",
    description: "Delete unsubmitted private verification uploads older than one hour",
  },
  "mark-completed-stays": {
    cron: "0 0 * * *",
    endpoint: "/api/cron/mark-completed-stays",
    maxAgeMs: 26 * 60 * 60 * 1000,
    label: "Mark completed stays",
    description: "Mark bookings as completed after checkout",
  },
  "process-account-deletions": {
    cron: "*/1 * * * *",
    endpoint: "/api/cron/process-account-deletions",
    maxAgeMs: 3 * 60 * 1000,
    label: "Process account deletions",
    description: "Remove account data in resumable batches and retain anonymized financial history",
  },
} as const;

export type CronJobName = keyof typeof CRON_SCHEDULES;
