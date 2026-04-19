import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildSearchParams, cn } from "@/lib/utils";

interface SearchPaginationProps {
  page: number;
  total: number;
  limit: number;
  params: Record<string, string | string[]>;
}

export function SearchPagination({ page, total, limit, params }: SearchPaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const base = Object.fromEntries(Object.entries(params).filter(([k]) => k !== "page"));

  function pageHref(p: number) {
    const qs = buildSearchParams({ ...base, page: p });
    return `/hostels${qs ? `?${qs}` : ""}`;
  }

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const btn = (active: boolean, disabled = false) =>
    cn(
      "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold border transition-all",
      active
        ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
        : disabled
        ? "pointer-events-none opacity-30 border-[var(--color-border)] text-[var(--color-muted)]"
        : "border-[var(--color-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:bg-[var(--color-ground)]"
    );

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-6" aria-label="Pagination">
      <Link href={pageHref(page - 1)} aria-disabled={page === 1} className={btn(false, page === 1)}>
        <ChevronLeft className="w-4 h-4" />
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-[var(--color-muted)]">…</span>
        ) : (
          <Link key={p} href={pageHref(p)} className={btn(p === page)}>
            {p}
          </Link>
        )
      )}

      <Link href={pageHref(page + 1)} aria-disabled={page === totalPages} className={btn(false, page === totalPages)}>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </nav>
  );
}
