"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, type LucideIcon } from "lucide-react";

export interface WorkspaceNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface WorkspaceMobileNavProps {
  items: WorkspaceNavItem[];
  label: string;
}

export function WorkspaceMobileNav({ items, label }: WorkspaceMobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navId = `${label.toLowerCase().replaceAll(" ", "-")}-mobile-navigation`;

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[color:var(--color-text-body)] hover:bg-[var(--color-bg-overlay)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
        aria-label={`${isOpen ? "Close" : "Open"} ${label.toLowerCase()} navigation`}
        aria-expanded={isOpen}
        aria-controls={navId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
      <nav
        id={navId}
        className={`${isOpen ? "block" : "hidden"} absolute right-0 top-full z-50 mt-2 max-h-[70dvh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-2 shadow-[var(--shadow-lg)]`}
        aria-label={`${label} navigation`}
      >
        <div className="grid grid-cols-2 gap-1">
          {items.map(({ href, label: itemLabel, icon: Icon, badge }) => {
            const isActive =
              href === "/owner/dashboard" || href === "/admin"
                ? pathname === href
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-[length:var(--text-body-sm)] font-[600] transition-colors ${
                  isActive
                    ? "bg-[var(--color-primary-faint)] text-[color:var(--color-primary-deep)]"
                    : "text-[color:var(--color-text-muted)] hover:bg-[var(--color-bg-sidebar)]"
                }`}
              >
                <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{itemLabel}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-warning)] px-1.5 text-[10px] font-[600] text-[color:var(--color-text-inverse)]">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="mt-2 flex items-center gap-2 border-t border-[var(--color-border-subtle)] px-3 py-3 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-heading)]"
        >
          Back to site
        </Link>
      </nav>
    </div>
  );
}
