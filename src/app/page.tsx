import Link from 'next/link';
import { LandingPage } from '@/components/landing/landing-page';
import { Building, Search, Heart, Mail, User, Menu } from 'lucide-react';

export default function Page() {
  return (
    <div className="bg-bg-page text-on-surface font-body-default min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-bg-page sticky top-0 z-50 border-b border-border-default shadow-sm shadow-primary-container/5">
        <div className="flex justify-between items-center w-full px-4 md:px-8 h-16 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="text-xl font-black tracking-tight text-primary-container flex items-center gap-2">
            <Building className="w-6 h-6" strokeWidth={1.5} />
            HostelPak
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-space-6">
            <Link
              href="/explore"
              className="text-action border-b-2 border-action pb-1 font-h3 font-medium text-sm hover:text-primary-deep transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/search"
              className="text-text-muted hover:text-primary-container transition-colors font-h3 font-medium text-sm pb-1"
            >
              Verified Hostels
            </Link>
            <Link
              href="/help"
              className="text-text-muted hover:text-primary-container transition-colors font-h3 font-medium text-sm pb-1"
            >
              Help
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-space-4">
            <Link href="/auth/signin" className="font-h3 font-medium text-sm text-text-muted hover:text-primary-container transition-colors">
              Sign In
            </Link>
            <Link
              href="/owner/login"
              className="font-h3 font-medium text-sm text-action hover:text-action-pressed transition-colors border border-border-default rounded px-space-3 py-space-1"
            >
              List Hostel
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-text-muted hover:text-text-heading">
            <Menu className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <LandingPage />

      {/* Footer */}
      <footer className="bg-bg-raised mt-auto border-t border-border-default py-space-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto px-space-6 gap-space-8">
          {/* Brand */}
          <div className="flex flex-col gap-space-4">
            <div className="text-text-heading font-bold text-lg">HostelPak</div>
            <p className="font-h3 text-xs text-text-muted">
              © 2024 HostelPak. Secure & Verified Student Housing.
            </p>
          </div>

          {/* Links 1 */}
          <div className="flex flex-col gap-space-2">
            <Link href="/about" className="font-h3 text-xs text-text-muted hover:text-action transition-colors">
              About
            </Link>
            <Link href="/privacy" className="font-h3 text-xs text-text-muted hover:text-action transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-h3 text-xs text-text-muted hover:text-action transition-colors">
              Terms of Service
            </Link>
          </div>

          {/* Links 2 */}
          <div className="flex flex-col gap-space-2">
            <Link href="/partner-support" className="font-h3 text-xs text-text-muted hover:text-action transition-colors">
              Partner Support
            </Link>
            <Link href="/contact" className="font-h3 text-xs text-text-muted hover:text-action transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="fixed bottom-0 w-full z-50 md:hidden bg-bg-card border-t border-border-default shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {/* Search Tab */}
          <Link
            href="/search"
            className="flex flex-col items-center justify-center text-action bg-bg-raised rounded-xl px-4 py-1"
          >
            <Search className="w-6 h-6" strokeWidth={1.5} />
            <span className="font-h3 text-[10px] font-semibold mt-1">Search</span>
          </Link>

          {/* Saved Tab */}
          <Link href="/saved" className="flex flex-col items-center justify-center text-text-muted">
            <Heart className="w-6 h-6" strokeWidth={1.5} />
            <span className="font-h3 text-[10px] font-semibold mt-1">Saved</span>
          </Link>

          {/* Inbox Tab */}
          <Link href="/inbox" className="flex flex-col items-center justify-center text-text-muted">
            <Mail className="w-6 h-6" strokeWidth={1.5} />
            <span className="font-h3 text-[10px] font-semibold mt-1">Inbox</span>
          </Link>

          {/* Profile Tab */}
          <Link href="/profile" className="flex flex-col items-center justify-center text-text-muted">
            <User className="w-6 h-6" strokeWidth={1.5} />
            <span className="font-h3 text-[10px] font-semibold mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
