// Path: src/components/hostel/Pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis
  function getPageNumbers(): (number | "ellipsis")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [];
    // Always show first page
    pages.push(1);
    // Left ellipsis
    if (currentPage > 4) pages.push("ellipsis");
    // Pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    // Right ellipsis
    if (currentPage < totalPages - 3) pages.push("ellipsis");
    // Always show last page
    pages.push(totalPages);
    return pages;
  }

  const pageNumbers = getPageNumbers();

  const btnBase =
    "inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-[var(--radius-md)] text-[var(--text-body-sm)] font-[500] transition-colors duration-[var(--transition-fast)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed";
  const btnInactive =
    "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-body)]";
  const btnActive =
    "bg-[var(--color-primary-faint)] text-[var(--color-primary-deep)]";

  return (
    <nav
      className="flex items-center justify-center gap-1 pt-8"
      aria-label="Pagination"
    >
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${btnInactive} gap-1`}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} strokeWidth={1.5} aria-hidden="true" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page numbers */}
      {pageNumbers.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex h-8 w-8 items-center justify-center text-[var(--color-text-muted)] text-[var(--text-body-sm)] select-none"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${btnInactive} gap-1`}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={15} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </nav>
  );
}