import Link from "next/link";

export function LegalPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="px-6 py-5">
        <Link
          className="text-[1.25rem] font-extrabold tracking-tight text-brand-dark"
          href="/"
        >
          HostelLo
        </Link>
      </header>
      <main className="mx-auto max-w-[720px] px-4 pb-16 pt-6">
        <h1 className="m-0 text-[2rem] font-bold text-ink">{title}</h1>
        <p
          className="mt-4 rounded-[14px] bg-surface-muted px-4 py-3 text-[0.95rem] text-ink"
          role="note"
        >
          This page is a placeholder. The {title.toLowerCase()} have not been
          published yet, and nothing here is legal guidance.
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
