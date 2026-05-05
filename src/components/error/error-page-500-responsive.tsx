'use client';

import React from 'react';
import { AlertTriangle, RotateCw, Bell, HelpCircle } from 'lucide-react';

interface ErrorPage500Props {
  onReload?: () => void;
  onReturnDashboard?: () => void;
  onNotifications?: () => void;
  onHelp?: () => void;
  onAddListing?: () => void;
  onProfileClick?: () => void;
}

export default function ErrorPage500Responsive({
  onReload = () => window.location.reload(),
  onReturnDashboard = () => (window.location.href = '/dashboard'),
  onNotifications = () => {},
  onHelp = () => {},
  onAddListing = () => {},
  onProfileClick = () => {},
}: ErrorPage500Props) {
  return (
    <div className="bg-bg-page min-h-screen flex flex-col font-body-default text-text-body antialiased">
      {/* TOP NAVIGATION BAR */}
      <nav className="bg-[#FEFCF8] border-b border-border-default shadow-sm shadow-amber-900/5 fixed top-0 h-16 w-full z-40 flex justify-between items-center px-6">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight text-text-heading font-h2">
            HostelLo
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onNotifications}
            className="hover:bg-primary-faint transition-colors scale-95 active:opacity-80 transition-transform duration-150 p-2 rounded-full text-text-muted hover:text-text-heading focus:outline-none focus:ring-2 focus:ring-primary-light/50"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={onHelp}
            className="hover:bg-primary-faint transition-colors scale-95 active:opacity-80 transition-transform duration-150 p-2 rounded-full text-text-muted hover:text-text-heading focus:outline-none focus:ring-2 focus:ring-primary-light/50"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={onAddListing}
            className="bg-action text-on-primary font-label text-label px-4 py-2 rounded font-medium hover:bg-action-dark active:bg-action-pressed transition-colors scale-95 active:opacity-80 duration-150 focus:outline-none focus:ring-2 focus:ring-action/50"
          >
            Add Listing
          </button>
          <button
            onClick={onProfileClick}
            className="w-8 h-8 rounded-full bg-primary-faint flex items-center justify-center overflow-hidden border border-border-default ml-2 hover:border-primary-container transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-light/50"
          >
            <div className="w-full h-full bg-gradient-to-br from-primary-light to-primary-faint" />
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT CANVAS */}
      <main className="flex-grow flex items-center justify-center px-4 pt-20 pb-8">
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 bg-bg-card p-8 rounded-xl border border-border-default shadow-sm">
          {/* Alert Icon */}
          <div className="w-24 h-24 rounded-full bg-primary-faint flex items-center justify-center text-warning mb-2">
            <AlertTriangle className="w-12 h-12" strokeWidth={1.5} />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h1 className="font-h3 text-h3 text-text-heading">Something went wrong</h1>
            <p className="font-body-default text-body-default text-text-muted">
              We've been notified. Try again in a moment.
            </p>
          </div>

          {/* Reload Button */}
          <button
            onClick={onReload}
            className="mt-4 bg-action text-on-primary font-label text-label px-6 py-3 rounded w-full hover:bg-action-dark active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action"
          >
            <RotateCw className="w-[18px] h-[18px]" strokeWidth={2} />
            Reload page
          </button>

          {/* Return Link */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onReturnDashboard();
            }}
            className="text-primary font-label text-label hover:underline mt-2 inline-block transition-colors hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light/50 rounded px-2 py-1"
          >
            Return to Dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
