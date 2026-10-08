import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { hostel: { findFirst: vi.fn() } } }));
vi.mock("@/components/owner/ListingFormWizard", () => ({
  ListingFormWizard: () => null,
}));

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { generateMetadata } from "./page";

const pageProps = { params: Promise.resolve({ id: "draft-hostel" }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.hostel.findFirst).mockResolvedValue({
    id: "hostel_1",
    name: "Private Draft Hostel",
    ownerId: "owner_1",
  } as any);
});

describe("owner listing edit metadata", () => {
  it("does not query listing data for anonymous visitors", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const metadata = await generateMetadata(pageProps);

    expect(metadata.title).toBe("Edit listing");
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
  });

  it("does not disclose a listing name to a different owner", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "owner_2", role: "OWNER" } } as any);

    const metadata = await generateMetadata(pageProps);

    expect(metadata.title).toBe("Edit listing");
  });

  it("shows the listing name to its owner", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as any);

    const metadata = await generateMetadata(pageProps);

    expect(metadata.title).toBe("Edit — Private Draft Hostel");
  });
});
