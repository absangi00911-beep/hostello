/**
 * scripts/reset-review-stats.ts
 *
 * Recalculates rating and reviewCount on every hostel from the actual
 * reviews table. Run this once to clear out any seeded/fake numbers.
 *
 * Usage:
 *   npx dotenv -e .env.local -- tsx scripts/reset-review-stats.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Recalculating hostel stats from real reviews…\n");

  const hostels = await db.hostel.findMany({
    select: { id: true, name: true, rating: true, reviewCount: true },
  });

  let updated = 0;
  let unchanged = 0;

  for (const hostel of hostels) {
    const agg = await db.review.aggregate({
      where: { hostelId: hostel.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const realRating = agg._avg.rating ?? 0;
    const realCount = agg._count.rating;

    // Only update if the numbers are actually wrong
    if (hostel.rating !== realRating || hostel.reviewCount !== realCount) {
      await db.hostel.update({
        where: { id: hostel.id },
        data: { rating: realRating, reviewCount: realCount },
      });

      console.log(
        `✓ ${hostel.name}\n` +
        `  Before → rating: ${hostel.rating.toFixed(1)}, reviews: ${hostel.reviewCount}\n` +
        `  After  → rating: ${realRating.toFixed(1)}, reviews: ${realCount}\n`
      );
      updated++;
    } else {
      unchanged++;
    }
  }

  console.log(
    `\nDone. ${updated} hostel${updated !== 1 ? "s" : ""} corrected, ` +
    `${unchanged} already accurate.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());