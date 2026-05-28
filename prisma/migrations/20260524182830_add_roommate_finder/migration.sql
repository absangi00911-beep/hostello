-- CreateTable
CREATE TABLE "roommate_posts" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "budget" INTEGER,
    "moveIn" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roommate_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roommate_reports" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roommate_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roommate_posts_hostelId_expiresAt_idx" ON "roommate_posts"("hostelId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "roommate_posts_hostelId_userId_key" ON "roommate_posts"("hostelId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "roommate_reports_postId_reporterId_key" ON "roommate_reports"("postId", "reporterId");

-- AddForeignKey
ALTER TABLE "roommate_posts" ADD CONSTRAINT "roommate_posts_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roommate_posts" ADD CONSTRAINT "roommate_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roommate_reports" ADD CONSTRAINT "roommate_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "roommate_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roommate_reports" ADD CONSTRAINT "roommate_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
