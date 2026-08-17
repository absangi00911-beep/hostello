// Path: src/app/api/admin/search/sync/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));

vi.mock("@/lib/typesense-sync", () => ({
  syncAllHostelsToTypesense: vi.fn(),
  indexSingleHostel: vi.fn(),
  removeHostelIndex: vi.fn(),
}));

import { POST } from "./route";
import { auth } from "@/lib/auth/config";
import { syncAllHostelsToTypesense, indexSingleHostel, removeHostelIndex } from "@/lib/typesense-sync";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}
function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
}

function req(body: unknown) {
  return new NextRequest("https://hostello.test/api/admin/search/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/search/sync", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await POST(req({ action: "sync-all" }));

    expect(res.status).toBe(403);
    expect(syncAllHostelsToTypesense).not.toHaveBeenCalled();
  });

  it("sync-all calls syncAllHostelsToTypesense", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(syncAllHostelsToTypesense).mockResolvedValue(undefined as any);

    const res = await POST(req({ action: "sync-all" }));

    expect(syncAllHostelsToTypesense).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("sync-single calls indexSingleHostel with the given hostelId", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(indexSingleHostel).mockResolvedValue(undefined as any);

    const res = await POST(req({ action: "sync-single", hostelId: "hst_1" }));

    expect(indexSingleHostel).toHaveBeenCalledWith("hst_1");
    expect(res.status).toBe(200);
  });

  it("sync-single without a hostelId falls through to the invalid-action branch", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await POST(req({ action: "sync-single" }));

    expect(res.status).toBe(400);
    expect(indexSingleHostel).not.toHaveBeenCalled();
  });

  it("remove calls removeHostelIndex with the given hostelId", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(removeHostelIndex).mockResolvedValue(undefined as any);

    const res = await POST(req({ action: "remove", hostelId: "hst_1" }));

    expect(removeHostelIndex).toHaveBeenCalledWith("hst_1");
    expect(res.status).toBe(200);
  });

  it("returns 400 for an unrecognized action", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await POST(req({ action: "wipe-everything" }));

    expect(res.status).toBe(400);
  });

  it("returns 500 rather than a clean 400 if the sync function itself throws (no per-action error handling)", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(syncAllHostelsToTypesense).mockRejectedValue(new Error("Typesense unreachable"));

    const res = await POST(req({ action: "sync-all" }));

    expect(res.status).toBe(500);
  });
});
