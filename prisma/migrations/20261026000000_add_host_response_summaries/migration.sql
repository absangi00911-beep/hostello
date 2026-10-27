CREATE TABLE "host_response_summaries" (
    "hostId" TEXT NOT NULL,
    "guestStartedThreadCount" INTEGER NOT NULL,
    "repliedThreadCount" INTEGER NOT NULL,
    "medianResponseSeconds" DOUBLE PRECISION,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_response_summaries_pkey" PRIMARY KEY ("hostId")
);

ALTER TABLE "host_response_summaries"
ADD CONSTRAINT "host_response_summaries_hostId_fkey"
FOREIGN KEY ("hostId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
