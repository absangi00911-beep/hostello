import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p
          className="text-8xl font-bold text-[var(--color-sand-200)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          404
        </p>
        <h1
          className="mt-4 text-2xl font-bold text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)] max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/hostels"
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-sand-100)] transition-colors"
          >
            Browse hostels
          </Link>
        </div>
      </div>
    </div>
  );
}
