'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

export function TopNav() {
  return (
    <nav className="bg-bg-page dark:bg-stone-900 text-action dark:text-emerald-400 font-['Be_Vietnam_Pro'] font-medium text-sm sticky top-0 z-50 border-b border-border-default dark:border-stone-800 shadow-sm shadow-primary/5">
      <div className="flex justify-between items-center w-full px-4 md:px-8 h-16 max-w-7xl mx-auto">
        <div className="text-xl font-black tracking-tight text-primary-container">HostelPak</div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-space-6">
          <a href="/" className="text-stone-600 dark:text-stone-400 hover:text-primary-container transition-colors">
            Explore
          </a>
          <a href="/" className="text-action border-b-2 border-action hover:text-primary-container transition-colors">
            Verified Hostels
          </a>
          <a href="/" className="text-stone-600 dark:text-stone-400 hover:text-primary-container transition-colors">
            Help
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-space-4">
          {/* Search Bar (Desktop) */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-surface-container rounded-full pl-9 pr-4 py-1.5 text-sm border-none focus:ring-2 focus:ring-primary-container text-on-surface placeholder:text-text-placeholder w-48"
            />
          </div>

          {/* List Hostel Button */}
          <button className="font-label text-label text-action hover:text-primary-container transition-colors">
            List Hostel
          </button>

          {/* Sign In Button */}
          <button className="bg-action hover:bg-action-pressed text-on-primary px-space-4 py-space-2 rounded-full font-label text-label transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}
