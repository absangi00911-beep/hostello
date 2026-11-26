import Link from "next/link";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function LegalPlaceholderPage({
  title,
  user = null,
}: {
  title: string;
  user?: BrowseAccountUser | null;
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader hideOnMobile={false} user={user} />
      <main id="main-content" className="mx-auto max-w-[720px] px-4 pb-16 pt-6">
        <h1 className="m-0 text-display font-bold text-ink">{title}</h1>
        <p
          className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-body text-ink"
          role="note"
        >
          This page is a placeholder. Published content is not yet available,
          and nothing here is legal guidance.
        </p>
        <p className="mt-4 text-muted">
          If you have questions in the meantime, please{" "}
          <Link
            className="font-semibold text-brand hover:underline"
            href="/contact"
          >
            contact the HostelLo team
          </Link>
          .
        </p>
        <Link
          className="mt-6 inline-block font-semibold text-brand hover:underline"
          href="/"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
