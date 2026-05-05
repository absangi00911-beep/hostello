'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    for (let i = 1; i <= Math.min(3, totalPages); i++) {
      pages.push(i);
    }

    if (totalPages > 5) {
      pages.push('...');
    }

    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-space-2 mt-space-8">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded border border-border-default text-text-muted hover:border-primary-container hover:text-primary-deep transition-colors bg-bg-card shadow-sm disabled:opacity-50"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, idx) => (
        <button
          key={idx}
          onClick={() => typeof page === 'number' && onPageChange?.(page)}
          disabled={page === '...'}
          className={`w-10 h-10 flex items-center justify-center rounded border font-label text-label font-bold shadow-sm transition-colors ${
            page === currentPage
              ? 'border-primary-container bg-primary-container text-white'
              : page === '...'
              ? 'border-none text-text-muted cursor-default'
              : 'border-border-default text-text-heading bg-bg-card hover:border-primary-container hover:text-primary-deep'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded border border-border-default text-text-muted hover:border-primary-container hover:text-primary-deep transition-colors bg-bg-card shadow-sm disabled:opacity-50"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
