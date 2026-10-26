import { afterEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/client";
import type { Prisma as PrismaTypes } from "@/generated/client";
import { refreshHostResponseSummary } from "./host-response-summary";
import { main as backfillHostResponseSummaries } from "../../scripts/backfill-host-response-summaries";

function transactionWithAggregate(row: {
  guestStartedThreadCount: number;
  repliedThreadCount: number;
  medianResponseSeconds: number | null;
}) {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([row]),
    hostResponseSummary: {
      upsert: vi.fn().mockResolvedValue(undefined),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };

  return tx as unknown as PrismaTypes.TransactionClient;
}

describe("refreshHostResponseSummary", () => {
  it("calculates_response_rate_counts_and_median", async () => {
    const tx = transactionWithAggregate({
      guestStartedThreadCount: 4,
      repliedThreadCount: 3,
      medianResponseSeconds: 120,
    });

    await refreshHostResponseSummary("owner-1", tx);

    expect(tx.hostResponseSummary.upsert).toHaveBeenCalledWith({
      where: { hostId: "owner-1" },
      create: {
        hostId: "owner-1",
        guestStartedThreadCount: 4,
        repliedThreadCount: 3,
        medianResponseSeconds: 120,
        calculatedAt: expect.any(Date),
      },
      update: {
        guestStartedThreadCount: 4,
        repliedThreadCount: 3,
        medianResponseSeconds: 120,
        calculatedAt: expect.any(Date),
      },
    });
  });

  it("uses_created_at_then_id_for_first_message_and_reply", async () => {
    const tx = transactionWithAggregate({
      guestStartedThreadCount: 0,
      repliedThreadCount: 0,
      medianResponseSeconds: null,
    });

    await refreshHostResponseSummary("owner-1", tx);

    const query = vi.mocked(tx.$queryRaw).mock.calls[0][0] as ReturnType<typeof Prisma.sql>;
    expect(query.sql).toContain('ORDER BY m."conversationId", m."createdAt", m."id"');
    expect(query.sql).toContain('ORDER BY gs."conversationId", reply."createdAt", reply."id"');
    expect(query.sql).toContain('(reply."createdAt", reply."id") > (gs."guestCreatedAt", gs."guestMessageId")');
  });

  it("does_not_count_a_non_student_non_owner_first_sender_as_guest_started", async () => {
    const tx = transactionWithAggregate({
      guestStartedThreadCount: 0,
      repliedThreadCount: 0,
      medianResponseSeconds: null,
    });

    await refreshHostResponseSummary("owner-1", tx);

    const query = vi.mocked(tx.$queryRaw).mock.calls[0][0] as ReturnType<typeof Prisma.sql>;
    expect(query.sql).toContain('JOIN "users" sender ON sender."id" = m."senderId"');
    expect(query.sql).toContain('sender."role" AS "senderRole"');
    expect(query.sql).toContain('fm."senderRole" = \'STUDENT\'');
    expect(query.sql).toContain('ORDER BY m."conversationId", m."createdAt", m."id"');
    expect(query.sql).toContain('JOIN "hostels" h ON h."id" = c."hostelId"');
    expect(query.sql).not.toContain('"status"');
  });

  it("omits_summary_without_guest_started_threads", async () => {
    const tx = transactionWithAggregate({
      guestStartedThreadCount: 0,
      repliedThreadCount: 0,
      medianResponseSeconds: null,
    });

    await refreshHostResponseSummary("owner-1", tx);

    expect(tx.hostResponseSummary.deleteMany).toHaveBeenCalledWith({
      where: { hostId: "owner-1" },
    });
    expect(tx.hostResponseSummary.upsert).not.toHaveBeenCalled();
  });

  it("keeps_zero_rate_and_null_median_for_unanswered_threads", async () => {
    const tx = transactionWithAggregate({
      guestStartedThreadCount: 2,
      repliedThreadCount: 0,
      medianResponseSeconds: null,
    });

    await refreshHostResponseSummary("owner-1", tx);

    expect(tx.hostResponseSummary.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          guestStartedThreadCount: 2,
          repliedThreadCount: 0,
          medianResponseSeconds: null,
        }),
        update: expect.objectContaining({
          guestStartedThreadCount: 2,
          repliedThreadCount: 0,
          medianResponseSeconds: null,
        }),
      }),
    );
  });

  it("refreshes_all_listing_history_without_selecting_message_content", async () => {
    const tx = transactionWithAggregate({
      guestStartedThreadCount: 1,
      repliedThreadCount: 1,
      medianResponseSeconds: 5,
    });

    await refreshHostResponseSummary("owner-parameter", tx);

    const query = vi.mocked(tx.$queryRaw).mock.calls[0][0] as ReturnType<typeof Prisma.sql>;
    expect(query.sql).toContain('JOIN "hostels" h ON h."id" = c."hostelId"');
    expect(query.text).toContain('h."ownerId" = $1');
    expect(query.values).toContain("owner-parameter");
    expect(query.sql).not.toContain('"content"');
    expect(query.sql).not.toContain('"status"');
  });
});

describe("host response summary backfill", () => {
  const originalExitCode = process.exitCode;

  afterEach(() => {
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  it("backfill_is_idempotent_and_fails_explicitly", async () => {
    const tx = transactionWithAggregate({
      guestStartedThreadCount: 1,
      repliedThreadCount: 1,
      medianResponseSeconds: 5,
    });
    const client = {
      user: {
        findMany: vi.fn().mockResolvedValue([{ id: "owner-secret" }]),
      },
      $transaction: vi.fn(async (callback: (transaction: PrismaTypes.TransactionClient) => Promise<void>) =>
        callback(tx),
      ),
      $disconnect: vi.fn().mockResolvedValue(undefined),
    };
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await backfillHostResponseSummaries(client as never);
    await backfillHostResponseSummaries(client as never);

    expect(tx.hostResponseSummary.upsert).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/1 host/));
    expect(log.mock.calls.flat().join(" ")).not.toContain("owner-secret");

    client.user.findMany.mockRejectedValueOnce(new Error("database unavailable"));
    await backfillHostResponseSummaries(client as never);

    expect(process.exitCode).toBe(1);
    expect(error).toHaveBeenCalledWith("Host response summary backfill failed.");
    expect(client.$disconnect).toHaveBeenCalledTimes(3);
  });
});
