import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterLayout from "./layout";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

type TestRole = "STUDENT" | "OWNER" | "ADMIN";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

function sessionFor(role: TestRole) {
  return {
    user: {
      id: `${role.toLowerCase()}-1`,
      name: role,
      email: `${role.toLowerCase()}@example.com`,
      role,
    },
    expires: "2026-06-24T00:00:00.000Z",
  };
}

describe("RegisterLayout role guard", () => {
  const mockedAuth = vi.mocked(auth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders registration for guests", async () => {
    mockedAuth.mockResolvedValue(null as any);

    const markup = renderToStaticMarkup(
      await RegisterLayout({ children: <p>Create account</p> }),
    );

    expect(markup).toContain("Create account");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects signed-in students away from owner registration", async () => {
    mockedAuth.mockResolvedValue(sessionFor("STUDENT") as any);

    await expect(
      RegisterLayout({ children: <p>Hostel owner</p> }),
    ).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("redirects signed-in owners to their dashboard", async () => {
    mockedAuth.mockResolvedValue(sessionFor("OWNER") as any);

    await expect(
      RegisterLayout({ children: <p>Hostel owner</p> }),
    ).rejects.toThrow("NEXT_REDIRECT:/owner/dashboard");
  });

  it("redirects signed-in admins to the admin dashboard", async () => {
    mockedAuth.mockResolvedValue(sessionFor("ADMIN") as any);

    await expect(
      RegisterLayout({ children: <p>Hostel owner</p> }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin");
  });
});
