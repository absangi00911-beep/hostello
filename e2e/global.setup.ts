// e2e/global.setup.ts
//
// Runs once before any test suite.  Creates the shared test owner, student,
// and an ACTIVE hostel that specs can navigate to without seeding their own
// data.  IDs and credentials are written to e2e/.test-state.json so that
// fixtures and the teardown file can read them without re-querying the DB.
//
// Requirements:
//   DATABASE_URL must point at a test DB (not production).
//   bcryptjs must be a dependency (it already is — used by the auth routes).

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

export const STATE_FILE = path.join(__dirname, ".test-state.json");
export const TEST_PASSWORD = "E2eTestPwd123!";

const OWNER_EMAIL   = "e2e-owner@hostello.test";
const STUDENT_EMAIL = "e2e-student@hostello.test";
const HOSTEL_SLUG   = "e2e-test-hostel";

async function globalSetup() {
  const db = new PrismaClient();

  try {
    // Guard: refuse to run against a production-looking DB.
    const dbUrl = process.env.DATABASE_URL ?? "";
    if (!dbUrl.includes("test") && !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
      throw new Error(
        "[E2E setup] DATABASE_URL does not look like a test database. " +
          "Refusing to seed. Set DATABASE_URL to a local or test DB."
      );
    }

    // Clean up any leftover state from an interrupted previous run.
    await db.booking.deleteMany({
      where: { hostel: { slug: HOSTEL_SLUG } },
    });
    await db.hostel.deleteMany({ where: { slug: HOSTEL_SLUG } });
    await db.user.deleteMany({
      where: { email: { in: [OWNER_EMAIL, STUDENT_EMAIL] } },
    });

    const hash = await bcrypt.hash(TEST_PASSWORD, 10);

    // Owner
    const owner = await db.user.create({
      data: {
        email:         OWNER_EMAIL,
        name:          "E2E Test Owner",
        password:      hash,
        emailVerified: new Date(),
        role:          "OWNER",
      },
    });

    // Student
    const student = await db.user.create({
      data: {
        email:         STUDENT_EMAIL,
        name:          "E2E Test Student",
        password:      hash,
        emailVerified: new Date(),
        role:          "STUDENT",
      },
    });

    // Active hostel with one room that has available spots
    const hostel = await db.hostel.create({
      data: {
        name:          "E2E Test Hostel",
        slug:          HOSTEL_SLUG,
        description:   "Hostel created by the E2E test suite. Do not modify manually.",
        status:        "ACTIVE",
        city:          "Islamabad",
        area:          "F-7",
        address:       "1 Test Street, F-7, Islamabad",
        pricePerMonth: 15000,
        rooms:         1,
        capacity:      10,
        gender:        "MIXED",
        minStay:       1,
        amenities:     ["wifi", "laundry"],
        rules:         ["no smoking"],
        images:        [],
        verified:      true,
        ownerId:       owner.id,
        rooms_rel: {
          create: {
            name:          "Standard Room",
            pricePerMonth: 15000,
            capacity:      2,
            available:     5,
          },
        },
      },
    });

    const state = {
      owner:   { id: owner.id,   email: OWNER_EMAIL,   password: TEST_PASSWORD },
      student: { id: student.id, email: STUDENT_EMAIL, password: TEST_PASSWORD },
      hostel:  { id: hostel.id,  slug: hostel.slug,    name: hostel.name },
    };

    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
    console.log("[E2E setup] Test state written to", STATE_FILE);
  } finally {
    await db.$disconnect();
  }
}

export default globalSetup;
