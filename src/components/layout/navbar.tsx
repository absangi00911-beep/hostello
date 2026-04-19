"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Heart, BookOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

const NAV_LINKS = [
  { href: "/hostels", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const solid = !isHome || scrolled || mobileOpen;

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-200",
        solid
          ? "bg-white/95 backdrop-blur-md border-b border-[var(--color-border)]"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">

          <Logo solid={solid} />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  solid
                    ? "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-ground)]"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                {session.user.role === "OWNER" && (
                  <Link
                    href="/dashboard/hostels/new"
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                      solid
                        ? "text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]"
                        : "text-[var(--color-brand-400)] hover:bg-white/8"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    List Hostel
                  </Link>
                )}

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      solid
                        ? "text-[var(--color-ink)] hover:bg-[var(--color-ground)]"
                        : "text-white hover:bg-white/8"
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] flex items-center justify-center text-xs font-bold">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate">{session.user.name?.split(" ")[0]}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", userMenuOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-[var(--color-border)] shadow-lg overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-[var(--color-border)]">
                          <p className="text-xs text-[var(--color-muted)]">Signed in as</p>
                          <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{session.user.email}</p>
                        </div>
                        <div className="py-1">
                          <DropdownLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                          <DropdownLink href="/favorites" icon={Heart} label="Saved Hostels" />
                          <DropdownLink href="/bookings" icon={BookOpen} label="My Bookings" />
                          <DropdownLink href="/profile" icon={User} label="Profile" />
                        </div>
                        <div className="border-t border-[var(--color-border)] py-1">
                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    solid
                      ? "text-[var(--color-ink)] hover:bg-[var(--color-ground)]"
                      : "text-white/70 hover:text-white hover:bg-white/8"
                  )}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--color-brand-500)] text-[var(--color-ink)] hover:bg-[var(--color-brand-400)] transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              "md:hidden p-2 rounded-lg transition-colors",
              solid ? "text-[var(--color-ink)] hover:bg-[var(--color-ground)]" : "text-white hover:bg-white/8"
            )}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden bg-white border-t border-[var(--color-border)] overflow-hidden"
          >
            <div className="px-4 pt-3 pb-2 space-y-0.5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-3 rounded-xl text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="px-4 pt-2 pb-4 border-t border-[var(--color-border)] mt-2 space-y-2">
              {session ? (
                <>
                  <div className="px-3 py-2.5 rounded-xl bg-[var(--color-ground)]">
                    <p className="text-xs text-[var(--color-muted)]">Signed in as</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{session.user.name}</p>
                  </div>
                  <Link href="/dashboard" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-ground)]">Dashboard</Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-3 rounded-xl text-sm font-medium text-center border border-[var(--color-border)] hover:bg-[var(--color-ground)] transition-colors">
                    Sign in
                  </Link>
                  <Link href="/signup" className="block px-3 py-3 rounded-xl text-sm font-bold text-center bg-[var(--color-brand-500)] text-[var(--color-ink)] hover:bg-[var(--color-brand-400)] transition-colors">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {userMenuOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setUserMenuOpen(false)} />
      )}
    </header>
  );
}

function DropdownLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors">
      <Icon className="w-4 h-4 text-[var(--color-muted)]" />
      {label}
    </Link>
  );
}
