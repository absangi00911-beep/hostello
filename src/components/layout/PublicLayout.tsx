// Path: src/components/layout/PublicLayout.tsx

import { Navbar } from "../Navbar";
import { Footer } from "../Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
  /** Pass true to remove the footer (e.g. search page with infinite scroll) */
  noFooter?: boolean;
}

export function PublicLayout({ children, noFooter = false }: PublicLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-bg-page)]">
      <Navbar />
      <main className="flex-1" id="main-content">
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}
