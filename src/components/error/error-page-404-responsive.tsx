'use client';

import React from 'react';
import { Search, Home } from 'lucide-react';

interface ErrorPage404Props {
  onSearchHostels?: () => void;
  onGoHome?: () => void;
}

export default function ErrorPage404Responsive({
  onSearchHostels = () => (window.location.href = '/search'),
  onGoHome = () => (window.location.href = '/'),
}: ErrorPage404Props) {
  return (
    <div className="bg-bg-page min-h-screen flex flex-col font-body-default text-text-body antialiased">
      {/* MAIN CONTENT CANVAS */}
      <main className="flex-grow flex items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-2xl w-full text-center flex flex-col items-center">
          {/* 404 Display */}
          <div className="relative flex justify-center items-center mb-8">
            <span className="text-[120px] font-display font-bold text-primary-faint leading-none select-none tracking-tighter">
              404
            </span>
          </div>

          {/* Headings & Copy */}
          <h1 className="font-h3 text-h3 text-text-heading mb-4">This page doesn't exist</h1>
          <p className="font-body-lg text-body-lg text-text-muted mb-8 max-w-md mx-auto">
            The hostel or page you're looking for may have moved or been removed.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={onSearchHostels}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-secondary text-on-secondary font-label text-label rounded hover:-translate-y-[1px] hover:shadow-md active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:ring-offset-2 focus:ring-offset-bg-page shadow-sm"
            >
              <Search className="w-[18px] h-[18px] mr-2" />
              Search Hostels
            </button>
            <button
              onClick={onGoHome}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-transparent border border-border-default text-text-heading font-label text-label rounded hover:bg-surface-container-low transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-border-strong/50 focus:ring-offset-2 focus:ring-offset-bg-page"
            >
              <Home className="w-[18px] h-[18px] mr-2" />
              Go Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
