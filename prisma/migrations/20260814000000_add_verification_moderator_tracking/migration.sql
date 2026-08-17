-- AlterTable
ALTER TABLE "users" ADD COLUMN     "verificationDecidedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;
