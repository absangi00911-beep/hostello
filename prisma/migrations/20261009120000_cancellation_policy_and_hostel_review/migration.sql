-- CreateEnum
CREATE TYPE "CancellationPolicy" AS ENUM ('FLEXIBLE', 'STANDARD', 'STRICT');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterEnum
ALTER TYPE "RefundState" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterTable
ALTER TABLE "hostels" ADD COLUMN "cancellationPolicy" "CancellationPolicy";

-- AlterTable
ALTER TABLE "bookings"
    ADD COLUMN "cancellationPolicy" "CancellationPolicy",
    ADD COLUMN "cancellationRefundAmount" INTEGER,
    ADD COLUMN "ownerResponseDueAt" TIMESTAMP(3),
    ADD COLUMN "ownerResponseReminderSentAt" TIMESTAMP(3),
    ADD COLUMN "refundedAmount" INTEGER NOT NULL DEFAULT 0;

-- Existing refunds were full refunds before partial refunds were introduced.
UPDATE "bookings"
SET "refundedAmount" = "total"
WHERE "paymentStatus" = 'REFUNDED';

-- CreateTable
CREATE TABLE "hostel_verification_reviews" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "ownerAuthorityChecked" BOOLEAN NOT NULL,
    "locationChecked" BOOLEAN NOT NULL,
    "listingDetailsChecked" BOOLEAN NOT NULL,
    "photosChecked" BOOLEAN NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_verification_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hostel_verification_reviews_hostelId_createdAt_idx"
    ON "hostel_verification_reviews"("hostelId", "createdAt");

-- CreateIndex
CREATE INDEX "hostel_verification_reviews_reviewedById_createdAt_idx"
    ON "hostel_verification_reviews"("reviewedById", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_status_paymentStatus_ownerResponseDueAt_idx"
    ON "bookings"("status", "paymentStatus", "ownerResponseDueAt");

-- AddForeignKey
ALTER TABLE "hostel_verification_reviews"
    ADD CONSTRAINT "hostel_verification_reviews_hostelId_fkey"
    FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
