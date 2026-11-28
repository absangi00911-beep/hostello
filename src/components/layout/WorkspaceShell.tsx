import Link from "next/link";
import type { ReactNode } from "react";

export interface WorkspaceNavigationItem {
  href: string;
  label: string;
}

interface WorkspaceShellProps {
  header: ReactNode;
  navigation: readonly WorkspaceNavigationItem[];
  activeHref: string;
  children: ReactNode;
}

export function WorkspaceShell({
  header,
  navigation,
  activeHref,
  children,
}: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {header}
      <div className="mx-auto grid w-full max-w-[1920px] gap-4 py-4 md:gap-6 md:py-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <nav
          aria-label="Workspace navigation"
          className="flex min-w-0 gap-2 overflow-x-auto border-b border-line px-5 pb-3 [@media(max-width:720px)]:grid [@media(max-width:720px)]:grid-cols-2 [@media(max-width:720px)]:overflow-visible md:px-16 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:border-b-0 lg:pb-0 lg:pl-16 lg:pr-4"
        >
          {navigation.map((item) => {
            const isActive = item.href === activeHref;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-label font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [@media(max-width:720px)]:border ${
                  isActive
                    ? "bg-brand-soft text-brand-dark [@media(max-width:720px)]:border-brand"
                    : "text-muted hover:bg-surface-muted hover:text-ink [@media(max-width:720px)]:border-line"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
