'use client';

import Link from 'next/link';
import { Search, Heart, Mail, User } from 'lucide-react';

export function BottomNav() {
  return (
    <nav className="bg-bg-page dark:bg-stone-900 text-action dark:text-emerald-400 font-['Be_Vietnam_Pro'] text-[10px] font-semibold fixed bottom-0 w-full z-50 md:hidden border-t border-border-default dark:border-stone-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex justify-around items-center h-16 px-2 pb-safe">
      <Link href="/search" className="flex flex-col items-center justify-center text-action dark:text-emerald-400 bg-bg-raised dark:bg-stone-800 rounded-xl px-4 py-1">
        <Search className="w-6 h-6 mb-1" />
        <span>Search</span>
      </Link>

      <Link href="/saved" className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-action transition-colors">
        <Heart className="w-6 h-6 mb-1" />
        <span>Saved</span>
      </Link>

      <Link href="/inbox" className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-action transition-colors">
        <Mail className="w-6 h-6 mb-1" />
        <span>Inbox</span>
      </Link>

      <Link href="/profile" className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-action transition-colors">
        <User className="w-6 h-6 mb-1" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
