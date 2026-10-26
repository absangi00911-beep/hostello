import { Prisma } from "@/generated/client";
import type { Prisma as PrismaTypes } from "@/generated/client";

type HostResponseAggregate = {
  guestStartedThreadCount: number;
  repliedThreadCount: number;
  medianResponseSeconds: number | null;
};

export async function refreshHostResponseSummary(
  hostId: string,
  tx: PrismaTypes.TransactionClient,
): Promise<void> {
  const [aggregate] = await tx.$queryRaw<HostResponseAggregate[]>(Prisma.sql`
    WITH host_conversations AS (
      SELECT c."id" AS "conversationId", h."ownerId"
      FROM "conversations" c
      JOIN "hostels" h ON h."id" = c."hostelId"
      WHERE h."ownerId" = ${hostId}
    ),
    first_messages AS (
      SELECT DISTINCT ON (m."conversationId")
        m."conversationId", m."senderId", sender."role" AS "senderRole", m."createdAt", m."id"
      FROM "messages" m
      JOIN host_conversations hc ON hc."conversationId" = m."conversationId"
      JOIN "users" sender ON sender."id" = m."senderId"
      ORDER BY m."conversationId", m."createdAt", m."id"
    ),
    guest_started AS (
      SELECT
        fm."conversationId",
        hc."ownerId",
        fm."createdAt" AS "guestCreatedAt",
        fm."id" AS "guestMessageId"
      FROM first_messages fm
      JOIN host_conversations hc ON hc."conversationId" = fm."conversationId"
      WHERE fm."senderRole" = 'STUDENT'
        AND fm."senderId" <> hc."ownerId"
    ),
    owner_replies AS (
      SELECT DISTINCT ON (gs."conversationId")
        gs."conversationId",
        EXTRACT(EPOCH FROM (reply."createdAt" - gs."guestCreatedAt"))::double precision
          AS "responseSeconds"
      FROM guest_started gs
      JOIN "messages" reply ON reply."conversationId" = gs."conversationId"
      WHERE reply."senderId" = gs."ownerId"
        AND (reply."createdAt", reply."id") > (gs."guestCreatedAt", gs."guestMessageId")
      ORDER BY gs."conversationId", reply."createdAt", reply."id"
    )
    SELECT
      COUNT(gs."conversationId")::int AS "guestStartedThreadCount",
      COUNT(orpl."conversationId")::int AS "repliedThreadCount",
      percentile_cont(0.5) WITHIN GROUP (ORDER BY orpl."responseSeconds")
        AS "medianResponseSeconds"
    FROM guest_started gs
    LEFT JOIN owner_replies orpl ON orpl."conversationId" = gs."conversationId"
  `);

  if (!aggregate) {
    throw new Error("Host response summary aggregation returned no result.");
  }

  if (aggregate.guestStartedThreadCount === 0) {
    await tx.hostResponseSummary.deleteMany({ where: { hostId } });
    return;
  }

  const summary = {
    guestStartedThreadCount: aggregate.guestStartedThreadCount,
    repliedThreadCount: aggregate.repliedThreadCount,
    medianResponseSeconds: aggregate.medianResponseSeconds,
  };
  const calculatedAt = new Date();

  await tx.hostResponseSummary.upsert({
    where: { hostId },
    create: { hostId, ...summary, calculatedAt },
    update: { ...summary, calculatedAt },
  });
}
