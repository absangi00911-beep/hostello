import { describe, expect, it } from "vitest";
import { CRON_SCHEDULES } from "./cron-schedules";

describe("CRON_SCHEDULES", () => {
  it("covers every cron route and includes token cleanup", () => {
    expect(Object.keys(CRON_SCHEDULES).sort()).toEqual([
      "cancel-abandoned-payments",
      "check-price-alerts",
      "cleanup-tokens",
      "cleanup-verification-uploads",
      "expire-unanswered-bookings",
      "mark-completed-stays",
      "process-account-deletions",
    ]);
    expect(Object.values(CRON_SCHEDULES).map(({ endpoint }) => endpoint).sort()).toEqual([
      "/api/cron/cancel-abandoned-payments",
      "/api/cron/check-price-alerts",
      "/api/cron/cleanup-tokens",
      "/api/cron/cleanup-verification-uploads",
      "/api/cron/expire-unanswered-bookings",
      "/api/cron/mark-completed-stays",
      "/api/cron/process-account-deletions",
    ]);
  });

  it("uses five-field cron expressions and sensible health windows", () => {
    for (const job of Object.values(CRON_SCHEDULES)) {
      expect(job.cron.trim().split(/\s+/)).toHaveLength(5);
      expect(job.maxAgeMs).toBeGreaterThan(0);
      expect(job.label.length).toBeGreaterThan(0);
    }
  });

  it("runs token cleanup daily after the midnight completion job", () => {
    expect(CRON_SCHEDULES["mark-completed-stays"].cron).toBe("0 0 * * *");
    expect(CRON_SCHEDULES["cleanup-tokens"].cron).toBe("0 1 * * *");
  });
});
