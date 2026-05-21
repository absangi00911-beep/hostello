-- AddColumn
ALTER TABLE "price_alerts" ADD COLUMN "unsubscribeToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "price_alerts_unsubscribeToken_key" ON "price_alerts"("unsubscribeToken");