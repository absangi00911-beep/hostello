import type { SeatHoldPreflightReport } from "./seat-hold-preflight";

type SeatHoldPreflightCliOptions = {
  preflight: () => Promise<SeatHoldPreflightReport>;
  write: (line: string) => void;
  writeError: (line: string) => void;
};

export async function runSeatHoldPreflightCli({
  preflight,
  write,
  writeError,
}: SeatHoldPreflightCliOptions): Promise<number> {
  try {
    const report = await preflight();
    write(JSON.stringify({
      status: report.ready ? "ready" : "blocked",
      counts: report.counts,
    }, null, 2));
    return report.ready ? 0 : 1;
  } catch {
    writeError("Seat-hold preflight failed. Check database connectivity and retry.");
    return 2;
  }
}
