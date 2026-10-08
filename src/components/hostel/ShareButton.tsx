"use client";

// Path: src/components/hostel/ShareButton.tsx

import { Share2 } from "lucide-react";

interface ShareButtonProps {
  url: string;
  name: string;
  price: number;
  /** "card" = absolute overlay on search grid · "detail" = inline header button */
  variant?: "card" | "detail";
}

export function ShareButton({ url, name, price, variant = "card" }: ShareButtonProps) {
  const text = `Check out this hostel on HostelLo!\n\n${name} — PKR ${price.toLocaleString("en-PK")}/mo\n${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();   // prevent card Link navigation

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: name, url }).catch(() => {});
    } else {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  }

  if (variant === "detail") {
    return (
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-3 py-1.5 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[color:var(--color-primary-deep)]"
        aria-label={`Share ${name} on WhatsApp`}
      >
        <Share2 size={14} strokeWidth={1.5} aria-hidden="true" />
        Share
      </a>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="absolute right-3 top-14 z-10 flex h-8 w-8 items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[color:var(--color-text-muted)] opacity-0 shadow-[var(--shadow-xs)] transition-opacity group-hover:opacity-100 hover:border-[var(--color-primary)] hover:text-[color:var(--color-primary-deep)] focus-visible:opacity-100"
      aria-label={`Share ${name} on WhatsApp`}
    >
      <Share2 size={15} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}