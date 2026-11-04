import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    className,
    href,
  }: {
    children: React.ReactNode;
    className?: string;
    href: string;
  }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

import RootError from "@/app/error";
import RootLoading from "@/app/loading";
import RootNotFound from "@/app/not-found";
import BookingNotFound from "@/app/bookings/[id]/not-found";
import HostelNotFound from "@/app/hostels/[param]/not-found";
import HostelError from "@/app/hostels/[param]/error";
import BookingError from "@/app/bookings/[id]/error";
import SearchError from "@/app/search/error";
import SearchLoading from "@/app/search/loading";
import HostelLoading from "@/app/hostels/[param]/loading";
import BookingLoading from "@/app/bookings/[id]/loading";

const notFoundPages = {
  root: RootNotFound,
  hostel: HostelNotFound,
  booking: BookingNotFound,
};

const errorPages = {
  root: RootError,
  search: SearchError,
  hostel: HostelError,
  booking: BookingError,
};

const loadingPages = {
  root: RootLoading,
  search: SearchLoading,
  hostel: HostelLoading,
  booking: BookingLoading,
};

describe("not-found pages", () => {
  for (const [name, Page] of Object.entries(notFoundPages)) {
    it(`${name} explains the problem and links back to listings`, () => {
      const markup = renderToStaticMarkup(<Page />);

      expect(markup).toContain("<h1");
      expect(markup).toContain('href="/"');
      expect(markup).toContain("Back to listings");
      expect(markup).toContain("min-h-11");
    });
  }
});

describe("error pages", () => {
  for (const [name, Page] of Object.entries(errorPages)) {
    it(`${name} shows a fixed message, no error detail, and a way back`, () => {
      const secret = new Error("PrismaClientKnownRequestError at /srv/app/db.ts");
      Object.assign(secret, { digest: "abc123digest" });
      const markup = renderToStaticMarkup(
        <Page error={secret} retry={vi.fn()} />,
      );

      expect(markup).toContain('role="alert"');
      expect(markup).toContain("Something went wrong");
      expect(markup).toContain("Try again");
      expect(markup).toContain('href="/"');
      expect(markup).not.toContain("Prisma");
      expect(markup).not.toContain("/srv/app");
      expect(markup).not.toContain("abc123digest");
    });
  }
});

describe("loading pages", () => {
  for (const [name, Page] of Object.entries(loadingPages)) {
    it(`${name} announces loading to assistive tech`, () => {
      const markup = renderToStaticMarkup(<Page />);

      expect(markup).toContain('role="status"');
      expect(markup).toContain("Loading…");
      expect(markup).toContain("motion-safe:animate-pulse");
    });
  }
});
