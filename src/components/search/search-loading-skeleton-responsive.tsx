'use client';

import React from 'react';
import { Search, Heart, Mail, User, Home } from 'lucide-react';

interface SearchLoadingSkeletonProps {
  onNavigate?: (path: string) => void;
  onListHostel?: () => void;
  onSignIn?: () => void;
}

export default function SearchLoadingSkeletonResponsive({
  onNavigate = () => {},
  onListHostel = () => {},
  onSignIn = () => {},
}: SearchLoadingSkeletonProps) {
  // Skeleton shimmer animation via inline styles
  const shimmerStyle = {
    background: 'linear-gradient(90deg, #E8DFCE 0%, #F0E8D8 50%, #E8DFCE 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite linear',
  };

  return (
    <div className="bg-bg-page min-h-screen text-on-surface font-body-default flex flex-col antialiased">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ===== TOP NAVIGATION BAR ===== */}
      <header className="bg-bg-page text-action font-h2 font-medium text-sm sticky top-0 z-50 border-b border-border-default shadow-sm shadow-primary-container/5">
        <div className="flex justify-between items-center w-full px-4 md:px-8 h-16 max-w-7xl mx-auto">
          {/* Brand Logo */}
          <div className="text-xl font-black tracking-tight text-primary-container">
            HostelPak
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex gap-8">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('explore');
              }}
              className="text-action border-b-2 border-action pb-1 hover:text-primary-container transition-colors duration-200"
            >
              Explore
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('verified');
              }}
              className="text-text-muted hover:text-primary-container transition-colors duration-200"
            >
              Verified Hostels
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('help');
              }}
              className="text-text-muted hover:text-primary-container transition-colors duration-200"
            >
              Help
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar Shimmer (Desktop) */}
            <div
              style={shimmerStyle}
              className="h-8 w-64 rounded-full hidden lg:block"
            />
            <button
              onClick={onListHostel}
              className="text-text-muted hover:text-primary-container transition-colors duration-200 font-label text-label scale-95 active:scale-90 transition-transform focus:outline-none focus:ring-2 focus:ring-primary-light/50 rounded px-2 py-1"
            >
              List Hostel
            </button>
            <button
              onClick={onSignIn}
              className="bg-action text-on-primary font-label text-label px-4 py-2 rounded-lg scale-95 active:scale-90 transition-transform focus:outline-none focus:ring-2 focus:ring-action/50"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* ===== SIDEBAR FILTERS (Desktop) ===== */}
        <aside className="hidden md:flex flex-col w-64 flex-shrink-0 p-6 border-r border-border-default space-y-8 overflow-y-auto">
          {/* Filter Block 1: Skeleton */}
          <div className="space-y-4">
            <div style={shimmerStyle} className="h-5 w-24 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div style={shimmerStyle} className="h-4 w-4 rounded" />
                  <div
                    style={shimmerStyle}
                    className="h-4 rounded flex-grow"
                    style={{
                      ...shimmerStyle,
                      width: `${80 + Math.random() * 40}px`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Filter Block 2: Skeleton */}
          <div className="space-y-4 pt-4 border-t border-border-default">
            <div style={shimmerStyle} className="h-5 w-32 rounded" />
            <div style={shimmerStyle} className="h-10 w-full rounded" />
          </div>

          {/* Filter Block 3: Skeleton */}
          <div className="space-y-4 pt-4 border-t border-border-default">
            <div style={shimmerStyle} className="h-5 w-20 rounded" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div style={shimmerStyle} className="h-4 w-4 rounded" />
                  <div
                    style={shimmerStyle}
                    className="h-4 rounded flex-grow"
                    style={{
                      ...shimmerStyle,
                      width: `${100 + Math.random() * 60}px`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ===== SEARCH RESULTS GRID ===== */}
        <main className="flex-1 p-4 md:p-8">
          {/* Results Header Skeleton */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <div style={shimmerStyle} className="h-8 w-48 rounded mb-2" />
              <div style={shimmerStyle} className="h-4 w-32 rounded" />
            </div>
            <div style={shimmerStyle} className="h-8 w-24 rounded hidden sm:block" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-bg-card rounded-xl border border-border-default overflow-hidden flex flex-col shadow-sm"
              >
                {/* Image Skeleton */}
                <div style={shimmerStyle} className="w-full aspect-video" />

                {/* Content Skeleton */}
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <div
                    style={shimmerStyle}
                    className="h-6 rounded"
                    style={{
                      ...shimmerStyle,
                      width: `${60 + Math.random() * 30}%`,
                    }}
                  />
                  <div
                    style={shimmerStyle}
                    className="h-4 rounded"
                    style={{
                      ...shimmerStyle,
                      width: `${40 + Math.random() * 30}%`,
                    }}
                  />
                  <div className="mt-auto pt-4 flex justify-between items-end">
                    <div
                      style={shimmerStyle}
                      className="h-6 rounded"
                      style={{
                        ...shimmerStyle,
                        width: `${50 + Math.random() * 40}px`,
                      }}
                    />
                    <div style={shimmerStyle} className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="bg-bg-card text-action font-h2 text-[10px] font-semibold fixed bottom-0 w-full z-50 md:hidden border-t border-border-default shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2 pb-safe">
          {[
            { id: 'search', label: 'Search', icon: <Search className="w-5 h-5 mb-1" />, isActive: true },
            { id: 'saved', label: 'Saved', icon: <Heart className="w-5 h-5 mb-1" /> },
            { id: 'inbox', label: 'Inbox', icon: <Mail className="w-5 h-5 mb-1" /> },
            { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5 mb-1" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-colors ${
                item.isActive
                  ? 'text-action bg-bg-raised'
                  : 'text-text-placeholder hover:text-text-muted'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
