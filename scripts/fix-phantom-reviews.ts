/**
 * Script to fix phantom reviews and ensure rating denormalization is correct.
 * Run with: npm exec tsx scripts/fix-phantom-reviews.ts
 * 
 * This script:
 * 1. For each hostel, counts actual reviews
 * 2. Recomputes average rating and review count
 * 3. Logs any hostels with mismatched data
 * 4. Fixes the denormalized fields
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function fixPhantomReviews() {
  console.log("Starting phantom review cleanup...\n");

  const hostels = await db.hostel.findMany({
    select: { id: true, name: true, rating: true, reviewCount: true },
  });

  let fixed = 0;
  let mismatches = 0;

  for (const hostel of hostels) {
    // Count actual reviews and compute real average
    const reviewAgg = await db.review.aggregate({
      where: { hostelId: hostel.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const realAverage = reviewAgg._avg.rating ?? 0;
    const realCount = reviewAgg._count.rating;

    // Check if denormalized fields match reality
    const ratingMismatch = Math.abs(hostel.rating - realAverage) > 0.01;
    const countMismatch = hostel.reviewCount !== realCount;

    if (ratingMismatch || countMismatch) {
      mismatches++;
      console.log(
        `❌ ${hostel.name}`
      );
      console.log(
        `   Stored: rating=${hostel.rating.toFixed(2)}, count=${hostel.reviewCount}`
      );
      console.log(
        `   Actual: rating=${realAverage.toFixed(2)}, count=${realCount}`
      );

      // Fix it
      await db.hostel.update({
        where: { id: hostel.id },
        data: {
          rating: realAverage,
          reviewCount: realCount,
        },
      });

      fixed++;
      console.log(`   ✓ Fixed\n`);
    }
  }

  console.log("\n✓ Cleanup complete");
  console.log(`  - ${hostels.length} hostels checked`);
  console.log(`  - ${mismatches} mismatches found`);
  console.log(`  - ${fixed} hostels fixed`);
}

fixPhantomReviews()
  .catch(console.error)
  .finally(() => db.$disconnect());
