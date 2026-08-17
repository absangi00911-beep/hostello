// e2e/global.teardown.ts
//
// Runs once after all test suites complete.  Deletes every record created by
// global.setup.ts in the correct FK order so no orphans are left behind.

import fs from "fs/promises";
import { STATE_FILE } from "./global.setup";
import { createE2EDb } from "./db";

async function globalTeardown() {
  const db = createE2EDb();

  try {
    const raw   = await fs.readFile(STATE_FILE, "utf-8").catch(() => null);
    if (!raw) return; // setup never ran — nothing to clean

    const state = JSON.parse(raw) as {
      owner:   { id: string };
      student: { id: string };
      hostel:  { id: string };
    };

    // Delete in FK order: bookings → rooms → hostel → users
    await db.booking.deleteMany({ where: { hostelId: state.hostel.id } });
    await db.room.deleteMany({ where: { hostelId: state.hostel.id } });
    await db.hostel.deleteMany({ where: { id: state.hostel.id } });
    await db.user.deleteMany({
      where: { id: { in: [state.owner.id, state.student.id] } },
    });

    await fs.unlink(STATE_FILE).catch(() => null);
    console.log("[E2E teardown] Test data removed.");
  } finally {
    await db.$disconnect();
  }
}

export default globalTeardown;
