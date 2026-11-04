import Link from "next/link";
import { siteCopy } from "@/lib/site-copy";

const linkClassName =
  "inline-flex min-h-11 items-center rounded-[8px] px-2 text-[0.875rem] font-semibold text-muted hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2";

/**
 * Shared site footer, rendered once from the root layout. Only links to pages
 * that exist today: Terms, Privacy and Contact (there is no /help page).
 */
export function SiteFooter() {
  const { footer } = siteCopy;

  return (
    <footer className="border-t border-line bg-white pb-[calc(80px+env(safe-area-inset-bottom))] min-[721px]:pb-0">
      <div className="mx-auto flex w-[min(1920px,calc(100%-var(--page-gutter-mobile)))] flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 min-[961px]:w-[min(1920px,calc(100%-var(--page-gutter-total)))]">
        <nav aria-label={footer.navLabel} className="-ml-2 flex flex-wrap">
          <Link className={linkClassName} href="/terms">
            {footer.terms}
          </Link>
          <Link className={linkClassName} href="/privacy">
            {footer.privacy}
          </Link>
          <Link className={linkClassName} href="/contact">
            {footer.contact}
          </Link>
        </nav>
        <p className="m-0 text-[0.8125rem] text-muted">
          © {new Date().getFullYear()} {footer.rights}
        </p>
      </div>
    </footer>
  );
}
