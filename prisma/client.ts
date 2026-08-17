import { PrismaClient } from "../src/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

// Prisma 7 uses the pg driver's own pool settings instead of its own defaults.
// The pg driver has no connection timeout by default (0), whereas Prisma 6 used
// 5 s. We set it explicitly to preserve the previous behaviour and avoid hung
// connections in production.
const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
