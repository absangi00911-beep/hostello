import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "next-auth/react";
import { BookingPanel } from "./BookingPanel";

type TestRole = "STUDENT" | "OWNER" | "ADMIN";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function mockSession(role: TestRole) {
  vi.mocked(useSession).mockReturnValue({
    data: {
      user: {
        id: `${role.toLowerCase()}-1`,
        name: role,
        email: `${role.toLowerCase()}@example.com`,
        role,
        emailVerified: new Date("2026-01-01T00:00:00.000Z"),
        tokenVersion: 0,
      },
      expires: "2026-06-24T00:00:00.000Z",
    },
    status: "authenticated",
    update: vi.fn(),
  });
}

function renderPanel() {
  return renderToStaticMarkup(
    <BookingPanel
      hostelId="hostel-1"
      hostelSlug="test-hostel"
      hostelName="Test Hostel"
      ownerId="owner-1"
      basePricePerMonth={25000}
      rooms={[
        {
          id: "room-1",
          name: "Standard Room",
          pricePerMonth: 25000,
          capacity: 2,
          available: 2,
        },
      ]}
    />,
  );
}

describe("BookingPanel role visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows booking controls to students", () => {
    mockSession("STUDENT");

    const markup = renderPanel();

    expect(markup).toContain("Request booking");
    expect(markup).not.toContain("Only student accounts can request bookings.");
  });

  it("hides booking controls from owners", () => {
    mockSession("OWNER");

    const markup = renderPanel();

    expect(markup).toContain("Only student accounts can request bookings.");
    expect(markup).not.toContain("Request booking");
  });

  it("hides booking controls from admins", () => {
    mockSession("ADMIN");

    const markup = renderPanel();

    expect(markup).toContain("Only student accounts can request bookings.");
    expect(markup).not.toContain("Request booking");
  });
});
