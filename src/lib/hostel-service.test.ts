import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/client";
import type { HostelCreateInput } from "@/lib/validations";
import { createHostelRecord } from "./hostel-service";

describe("createHostelRecord room inventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a room record with its own description, facilities, images, and capacity", async () => {
    const hostel = {
      id: "hostel_1",
      slug: "campus-hostel",
      name: "Campus Hostel",
      status: "PENDING_REVIEW",
      city: "Lahore",
      pricePerMonth: 25_000,
    };
    const client = {
      hostel: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(hostel),
      },
      room: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as unknown as Pick<Prisma.TransactionClient, "hostel" | "room">;
    const data = {
      name: "Campus Hostel",
      description: "A comfortable hostel with secure access and shared study facilities.",
      city: "Lahore",
      address: "123 Main Road, Lahore",
      pricePerMonth: 25_000,
      rooms: 1,
      capacity: 1,
      gender: "MIXED",
      cancellationPolicy: "STANDARD",
      minStay: 1,
      amenities: ["WiFi"],
      rules: [],
      images: [],
      roomTypes: [
        {
          name: "Private room",
          description: "Quiet room with a study desk.",
          pricePerMonth: 32_000,
          capacity: 1,
          facilities: ["Attached bathroom", "Study desk"],
          images: ["https://images.hostello.test/private-room.jpg"],
        },
      ],
    } satisfies HostelCreateInput;

    const result = await createHostelRecord(client, "owner_1", data);

    expect(result).toEqual(hostel);
    expect(client.room.createMany).toHaveBeenCalledWith({
      data: [
        {
          hostelId: "hostel_1",
          name: "Private room",
          description: "Quiet room with a study desk.",
          pricePerMonth: 32_000,
          capacity: 1,
          available: 1,
          images: ["https://images.hostello.test/private-room.jpg"],
          facilities: ["Attached bathroom", "Study desk"],
        },
      ],
    });
  });
});
