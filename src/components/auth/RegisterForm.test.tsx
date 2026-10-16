import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./RegisterForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("RegisterForm presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps account types as compact radios in modal presentation", () => {
    const markup = renderToStaticMarkup(
      <RegisterForm presentation="modal" />,
    );

    expect(markup).toContain('role="radiogroup" aria-label="Account type"');
    expect(markup).toContain('value="STUDENT"');
    expect(markup).toContain('value="OWNER"');
    expect(markup).not.toContain("How will you use HostelLo?");
    expect(markup).not.toContain("Find a room");
    expect(markup).not.toContain("List and manage rooms");
  });

  it("preserves the account type descriptions on the standalone page", () => {
    const markup = renderToStaticMarkup(<RegisterForm />);

    expect(markup).toContain("How will you use HostelLo?");
    expect(markup).toContain("Find a room");
    expect(markup).toContain("List and manage rooms");
  });
});
