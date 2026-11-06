import { pathToFileURL } from "node:url";
import { db } from "../src/lib/db";
import { runSeatHoldPreflight } from "../src/lib/seat-hold-preflight";
import { runSeatHoldPreflightCli } from "../src/lib/seat-hold-preflight-cli";

type PreflightDatabaseClient = Pick<typeof db, "$transaction" | "$disconnect">;

export async function main(client: PreflightDatabaseClient = db): Promise<number> {
  const exitCode = await runSeatHoldPreflightCli({
    preflight: () => client.$transaction(async (transaction) => {
      await transaction.$executeRaw`SET TRANSACTION READ ONLY`;
      return runSeatHoldPreflight(transaction);
    }),
    write: (line) => console.log(line),
    writeError: (line) => console.error(line),
  });

  try {
    await client.$disconnect();
  } catch {
    console.error("Seat-hold preflight could not close its database connection.");
    return 2;
  }

  return exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
