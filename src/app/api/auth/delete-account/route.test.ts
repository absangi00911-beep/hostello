import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  compare: vi.fn(),
  rateLimit: vi.fn(),
  sendEmail: vi.fn(),
  userFindUnique: vi.fn(),
  userDelete: vi.fn(),
  notificationDeleteMany: vi.fn(),
  participantDeleteMany: vi.fn(),
  messageDeleteMany: vi.fn(),
  favoriteDeleteMany: vi.fn(),
  priceAlertDeleteMany: vi.fn(),
  reviewFindMany: vi.fn(),
  reviewDeleteMany: vi.fn(),
  reviewAggregate: vi.fn(),
  hostelUpdate: vi.fn(),
  hostelDeleteMany: vi.fn(),
  bookingDeleteMany: vi.fn(),
  resetTokenDeleteMany: vi.fn(),
  phoneTokenDeleteMany: vi.fn(),
  sessionDeleteMany: vi.fn(),
  accountDeleteMany: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.userFindUnique, delete: mocks.userDelete },
    notification: { deleteMany: mocks.notificationDeleteMany },
    conversationParticipant: { deleteMany: mocks.participantDeleteMany },
    message: { deleteMany: mocks.messageDeleteMany },
    favorite: { deleteMany: mocks.favoriteDeleteMany },
    priceAlert: { deleteMany: mocks.priceAlertDeleteMany },
    review: {
      findMany: mocks.reviewFindMany,
      deleteMany: mocks.reviewDeleteMany,
      aggregate: mocks.reviewAggregate,
    },
    hostel: { update: mocks.hostelUpdate, deleteMany: mocks.hostelDeleteMany },
    booking: { deleteMany: mocks.bookingDeleteMany },
    passwordResetToken: { deleteMany: mocks.resetTokenDeleteMany },
    phoneVerificationToken: { deleteMany: mocks.phoneTokenDeleteMany },
    session: { deleteMany: mocks.sessionDeleteMany },
    account: { deleteMany: mocks.accountDeleteMany },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      user: { delete: mocks.userDelete },
      notification: { deleteMany: mocks.notificationDeleteMany },
      conversationParticipant: { deleteMany: mocks.participantDeleteMany },
      message: { deleteMany: mocks.messageDeleteMany },
      favorite: { deleteMany: mocks.favoriteDeleteMany },
      priceAlert: { deleteMany: mocks.priceAlertDeleteMany },
      review: {
        findMany: mocks.reviewFindMany,
        deleteMany: mocks.reviewDeleteMany,
        aggregate: mocks.reviewAggregate,
      },
      hostel: { update: mocks.hostelUpdate, deleteMany: mocks.hostelDeleteMany },
      booking: { deleteMany: mocks.bookingDeleteMany },
      passwordResetToken: { deleteMany: mocks.resetTokenDeleteMany },
      phoneVerificationToken: { deleteMany: mocks.phoneTokenDeleteMany },
      session: { deleteMany: mocks.sessionDeleteMany },
      account: { deleteMany: mocks.accountDeleteMany },
    })),
  },
}));
vi.mock("bcryptjs", () => ({ compare: mocks.compare }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email-templates/account-deleted", () => ({
  accountDeletedEmail: vi.fn(() => ({ subject: "Deleted", html: "Done" })),
}));

import { POST } from "./route";

const request = () => new Request("https://hostello.test/api/auth/delete-account", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ password: "valid-password" }),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "user_1", role: "STUDENT" } });
  mocks.compare.mockResolvedValue(true);
  mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 2, resetAt: Date.now() + 60_000 });
  mocks.userFindUnique.mockResolvedValue({
    id: "user_1",
    password: "hashed-password",
    name: "Student",
    email: "student@example.test",
  });
  mocks.userDelete.mockResolvedValue({ id: "user_1" });
  mocks.reviewAggregate.mockResolvedValue({ _avg: { rating: 4 }, _count: { rating: 1 } });
});

describe("POST /api/auth/delete-account", () => {
  it("pages surviving-hostel reviews and deletes owned-hostel data by relation", async () => {
    const firstPage = Array.from({ length: 200 }, (_, index) => ({
      id: `review_${String(index).padStart(3, "0")}`,
      hostelId: `hostel_${String(index).padStart(3, "0")}`,
    }));
    mocks.reviewFindMany
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([{ id: "review_200", hostelId: "hostel_200" }]);

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.reviewFindMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({
        userId: "user_1",
        hostel: { is: { ownerId: { not: "user_1" } } },
      }),
      take: 200,
      orderBy: { id: "asc" },
    }));
    expect(mocks.reviewFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({ id: { gt: "review_199" } }),
      take: 200,
    }));
    expect(mocks.reviewFindMany).toHaveBeenCalledTimes(2);
    expect(mocks.reviewDeleteMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: firstPage.map((review) => review.id) } },
    });
    expect(mocks.reviewDeleteMany).toHaveBeenLastCalledWith({
      where: { hostel: { is: { ownerId: "user_1" } } },
    });
    expect(mocks.bookingDeleteMany).toHaveBeenLastCalledWith({
      where: { hostel: { is: { ownerId: "user_1" } } },
    });
    expect(mocks.hostelDeleteMany).toHaveBeenCalledWith({ where: { ownerId: "user_1" } });
  });
});
