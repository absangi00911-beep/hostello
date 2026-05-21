/*
  Warnings:

  - You are about to alter the column `targetPrice` on the `price_alerts` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `lastKnownPrice` on the `price_alerts` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "price_alerts" ALTER COLUMN "targetPrice" SET DATA TYPE INTEGER,
ALTER COLUMN "lastKnownPrice" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "phone_verification_tokens" ADD CONSTRAINT "phone_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
