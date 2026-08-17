import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../src/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

loadEnv({ path: ".env.e2e", override: true });
loadEnv();

export function createE2EDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("[E2E] DATABASE_URL is required.");
  }

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
