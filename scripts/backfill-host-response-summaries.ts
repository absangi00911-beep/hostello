import { pathToFileURL } from "node:url";
import type { PrismaClient } from "../src/generated/client";
import { db } from "../src/lib/db";
import { refreshHostResponseSummary } from "../src/lib/host-response-summary";

type BackfillClient = Pick<PrismaClient, "user" | "$transaction" | "$disconnect">;

export async function main(client: BackfillClient = db): Promise<void> {
  let failed = false;

  try {
    const owners = await client.user.findMany({
      where: {
        hostels: {
          some: {
            conversations: {
              some: { messages: { some: {} } },
            },
          },
        },
      },
      select: { id: true },
    });

    for (const owner of owners) {
      await client.$transaction((tx) => refreshHostResponseSummary(owner.id, tx));
    }

    console.log(`Refreshed host response summaries for ${owners.length} hosts.`);
  } catch {
    failed = true;
    console.error("Host response summary backfill failed.");
  } finally {
    try {
      await client.$disconnect();
    } catch {
      failed = true;
      console.error("Host response summary backfill could not disconnect from the database.");
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
