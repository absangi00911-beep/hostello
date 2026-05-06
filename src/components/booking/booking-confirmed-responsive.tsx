'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Home,
  Bookmark,
  Mail,
  User,
  Receipt,
  MessageCircle,
} from 'lucide-react';
import { BUTTON_STYLES } from '@/lib/styling-constants';
import { PrimaryButton, SecondaryButton } from '@/components/ui';

interface BookingConfirmedProps {
  checkInDate?: string;
  checkInTime?: string;
  hostelName?: string;
  bookingReference?: string;
  onViewBooking?: () => void;
  onMessageOwner?: () => void;
  onNavigation?: (path: string) => void;
}

export default function BookingConfirmedResponsive({
  checkInDate = 'Sept 15, 2024',
  checkInTime = '2:00 PM',
  hostelName = 'Greenview Boys Hostel',
  bookingReference = 'HH-A83K-9M2',
  onViewBooking = () => {},
  onMessageOwner = () => {},
  onNavigation = () => {},
}: BookingConfirmedProps) {
  const [activeMobileNav, setActiveMobileNav] = useState('bookings');

  const steps = [
    {
      number: 1,
      title: 'Owner Confirmation',
      description: 'The hostel owner will review and confirm your booking within 24 hours.',
    },
    {
      number: 2,
      title: 'Payment Processing',
      description:
        'Your payment method will be charged once the booking is confirmed.',
    },
    {
      number: 3,
      title: 'Check-in Details',
      description: `Prepare for your stay. You can check in on ${checkInDate} after ${checkInTime}.`,
    },
  ];

  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Bookmark className="w-6 h-6" />,
      isFilled: true,
    },
    { id: 'inbox', label: 'Inbox', icon: <Mail className="w-6 h-6" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
  ];

  return (
    <div className="bg-bg-page text-on-surface font-body-default min-h-screen flex flex-col">
      {/* ===== TOP NAVIGATION (Desktop Only) ===== */}
      <nav className="hidden md:flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto border-b border-border-default bg-bg-page sticky top-0 z-50 shadow-[0_4px_20px_-4px_rgba(194,139,26,0.1)]">
        <div className="flex items-center gap-8">
          <a
            className="text-2xl font-extrabold text-primary-container uppercase tracking-tighter font-display"
            href="#"
          >
            HostelHub
          </a>
          <div className="flex gap-6">
            <a
              className="text-on-surface-variant hover:text-primary-container transition-colors duration-200 font-label text-label"
              href="#"
            >
              Explore
            </a>
            <a
              className="text-on-surface-variant hover:text-primary-container transition-colors duration-200 font-label text-label"
              href="#"
            >
              Verified Hostels
            </a>
            <a
              className="text-on-surface-variant hover:text-primary-container transition-colors duration-200 font-label text-label"
              href="#"
            >
              Help
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="font-label text-label text-on-surface-variant hover:text-primary-container transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light/50 rounded px-2 py-1">
            Sign In
          </button>
          <button className="bg-primary-container text-on-primary font-label text-label px-4 py-2 rounded shadow-sm hover:bg-primary-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light/50">
            List a Hostel
          </button>
        </div>
      </nav>

      {/* ===== MAIN CONTENT CANVAS ===== */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-[640px] mx-auto pb-24 md:pb-12">
        {/* Step Indicator */}
        <div className="w-full flex justify-center mb-8">
          <div className="flex items-center gap-2 text-text-placeholder font-overline text-overline">
            <span>1</span>
            <span className="w-4 h-[1px] bg-border-default"></span>
            <span>2</span>
            <span className="w-4 h-[1px] bg-border-default"></span>
            <span className="text-action font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Step 3
            </span>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-action-light text-action mb-4" aria-hidden="true">
            <CheckCircle className="w-12 h-12" strokeWidth={1.5} />
          </div>

          {/* Heading */}
          <h1 className="font-h1 text-h1 text-text-heading mb-2">Booking Confirmed</h1>

          {/* Description */}
          <p className="font-body-default text-body-default text-text-muted">
            You're all set! Your room at {hostelName} has been secured.
          </p>
        </div>

        {/* Booking Reference Card */}
        <div className="w-full bg-bg-card rounded-xl border border-border-default shadow-sm p-6 mb-8">
          <div className="flex flex-col items-center justify-center">
            <span className="font-overline text-overline text-text-muted uppercase mb-2">
              Booking Reference
            </span>
            <div className="bg-primary-faint px-4 py-2 rounded border border-primary-light">
              <span className="font-mono text-lg font-bold text-primary-deep tracking-wider">
                {bookingReference}
              </span>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="w-full mb-12">
          <h3 className="font-h3 text-h3 text-text-heading mb-4">What happens next?</h3>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-text-body font-bold text-sm">
                  {step.number}
                </div>
                <div>
                  <h4 className="font-label text-label text-text-heading">
                    {step.title}
                  </h4>
                  <p className="font-body-default text-body-default text-text-muted mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-4">
          <SecondaryButton
            onClick={onViewBooking}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            View Booking
          </SecondaryButton>
          <PrimaryButton
            onClick={onMessageOwner}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Message Owner
          </PrimaryButton>
        </div>
      </main>

      {/* ===== BOTTOM NAVIGATION (Mobile Only) ===== */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 border-t border-border-default rounded-t-lg bg-white/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(194,139,26,0.08)] flex justify-around items-center px-4 py-3 pb-safe" role="tablist">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMobileNav(item.id);
              onNavigation(item.id);
            }}
            aria-label={item.label}
            aria-selected={activeMobileNav === item.id}
            role="tab"
            className={`flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
              activeMobileNav === item.id
                ? 'text-primary-container scale-110'
                : 'text-on-surface-variant hover:text-primary-container'
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span className="mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
