import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { PATCH } from "@/app/api/profile/route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-1",
        name: "Ayesha Khan",
        email: "ayesha@example.com",
        role: "STUDENT",
      },
      expires: "2026-06-01T00:00:00.000Z",
    });
  });

  it("persists an uploaded avatar URL without clearing omitted fields", async () => {
    const avatar = "https://images.unsplash.com/profile-photo.jpg";
    vi.mocked(db.user.update).mockResolvedValue({
      id: "user-1",
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "03001234567",
      bio: "Student",
      city: "Lahore",
      avatar,
    } as Awaited<ReturnType<typeof db.user.update>>);

    const req = new NextRequest("https://hostello.test/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ avatar }),
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { avatar },
      }),
    );
    expect(body.data.avatar).toBe(avatar);
  });
});
