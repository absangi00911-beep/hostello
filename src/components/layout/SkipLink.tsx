// First focusable element on every page: lets keyboard and screen-reader users jump past
// the header and navigation. Hidden until it receives focus. Every page's <main> carries
// id="main-content" (see skip-link-policy.test.ts).
export const MAIN_CONTENT_ID = "main-content";

export function SkipLink() {
  return (
    <a
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[2000] focus-visible:rounded-[8px] focus-visible:bg-ink focus-visible:px-4 focus-visible:py-3 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      href={`#${MAIN_CONTENT_ID}`}
    >
      Skip to main content
    </a>
  );
}
