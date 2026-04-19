import Link from "next/link";
import { Search } from "lucide-react";

export default function HostelNotFound() {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-sand-100)] flex items-center justify-center mx-auto mb-5">
          <Search className="w-7 h-7 text-[var(--color-sand-400)]" />
        </div>
        <h1
          className="text-2xl font-bold text-[var(--color-text)] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Hostel not found
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          This listing may have been removed or the URL is incorrect.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/hostels"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] transition-colors text-center"
          >
            Browse all hostels
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-sand-50)] transition-colors text-center"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
