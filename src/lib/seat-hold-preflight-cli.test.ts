import { describe, expect, it } from "vitest";
import { runSeatHoldPreflightCli } from "./seat-hold-preflight-cli";
import type { SeatHoldPreflightReport } from "./seat-hold-preflight";

const cleanReport: SeatHoldPreflightReport = {
  ready: true,
  counts: {
    activeBookings: 0,
    backfillableBookings: 0,
    seatHoldsToBackfill: 0,
    unresolvedBookings: 0,
    roomlessBookings: 0,
    invalidDateBookings: 0,
    invalidGuestCounts: 0,
    unknownRooms: 0,
    invalidRoomCapacities: 0,
    roomHostelMismatches: 0,
    overCapacityRooms: 0,
  },
};

describe("runSeatHoldPreflightCli", () => {
  it("prints aggregate-only output and exits successfully for a clean preflight", async () => {
    const output: string[] = [];

    const exitCode = await runSeatHoldPreflightCli({
      preflight: async () => cleanReport,
      write: (line) => output.push(line),
      writeError: () => undefined,
    });

    expect(exitCode).toBe(0);
    expect(JSON.parse(output.join("\n"))).toEqual({ status: "ready", counts: cleanReport.counts });
  });

  it("prints no booking or student identifiers and exits non-zero when unresolved", async () => {
    const output: string[] = [];
    const blockedReport: SeatHoldPreflightReport = {
      ...cleanReport,
      ready: false,
      counts: {
        ...cleanReport.counts,
        activeBookings: 1,
        unresolvedBookings: 1,
        roomlessBookings: 1,
      },
    };

    const exitCode = await runSeatHoldPreflightCli({
      preflight: async () => blockedReport,
      write: (line) => output.push(line),
      writeError: () => undefined,
    });
    const rendered = output.join("\n");

    expect(exitCode).toBe(1);
    expect(rendered).toContain('"roomlessBookings": 1');
    expect(rendered).not.toMatch(/booking-private|student|@/i);
  });

  it("returns a distinct non-zero code without exposing database errors", async () => {
    const output: string[] = [];
    const errors: string[] = [];

    const exitCode = await runSeatHoldPreflightCli({
      preflight: async () => {
        throw new Error("private connection details");
      },
      write: (line) => output.push(line),
      writeError: (line) => errors.push(line),
    });

    expect(exitCode).toBe(2);
    expect(output).toEqual([]);
    expect(errors.join(" ")).not.toContain("private connection details");
  });
});
