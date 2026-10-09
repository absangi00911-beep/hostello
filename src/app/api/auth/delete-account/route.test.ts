import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  compare: vi.fn(),
  rateLimit: vi.fn(),
  sendEmail: vi.fn(),
  userFindUnique: vi.fn(),
  enqueueAccountDeletion: vi.fn(),
  removeDeletedOwnerHostelsFromSearch: vi.fn(),
  invalidateLocalSessionCache: vi.fn(),
  setTokenVersion: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
  auth: mocks.auth,
  invalidateLocalSessionCache: mocks.invalidateLocalSessionCache,
}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.userFindUnique } } }));
vi.mock("@/lib/account-deletion", () => ({
  enqueueAccountDeletion: mocks.enqueueAccountDeletion,
  removeDeletedOwnerHostelsFromSearch: mocks.removeDeletedOwnerHostelsFromSearch,
}));
vi.mock("@/lib/auth/token-version-cache", () => ({ setTokenVersion: mocks.setTokenVersion }));
vi.mock("bcryptjs", () => ({ compare: mocks.compare }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email-templates/account-deleted", () => ({
  accountDeletedEmail: vi.fn(() => ({ subject: "Request received", html: "Queued" })),
}));

import { POST } from "./route";

const request = () => new Request("https://hostello.test/api/auth/delete-account", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ confirmation: "DELETE", password: "valid-password" }),
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
    role: "STUDENT",
  });
  mocks.enqueueAccountDeletion.mockResolvedValue({
    kind: "queued",
    email: "student@example.test",
    name: "Student",
    activeHostelIds: ["hostel_1"],
    tokenVersion: 3,
  });
  mocks.sendEmail.mockResolvedValue({ success: true });
});

describe("POST /api/auth/delete-account", () => {
  it("requires password confirmation and queues bounded deletion work", async () => {
    const response = await POST(request() as never);
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.success).toBe(true);
    expect(mocks.compare).toHaveBeenCalledWith("valid-password", "hashed-password");
    expect(mocks.enqueueAccountDeletion).toHaveBeenCalledWith("user_1");
    expect(mocks.invalidateLocalSessionCache).toHaveBeenCalledWith("user_1");
    expect(mocks.setTokenVersion).toHaveBeenCalledWith("user_1", 3);
    expect(mocks.removeDeletedOwnerHostelsFromSearch).toHaveBeenCalledWith(["hostel_1"]);
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "student@example.test",
      subject: "Request received",
    }));
  });
});
