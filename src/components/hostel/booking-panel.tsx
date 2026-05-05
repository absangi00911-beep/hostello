'use client';

import { useState } from 'react';

interface BookingPanelProps {
  selectedRoomType: string;
  onRoomTypeChange: (type: string) => void;
}

export function BookingPanel({ selectedRoomType, onRoomTypeChange }: BookingPanelProps) {
  const [moveInDate, setMoveInDate] = useState<string>('');
  const [duration, setDuration] = useState<string>('6 Months');

  const roomPrices: Record<string, number> = {
    'Single Executive': 45000,
    'Double Shared': 30000,
    'Triple Shared': 22000,
  };

  const monthCount = parseInt(duration.split(' ')[0]);
  const monthlyRent = roomPrices[selectedRoomType] || 30000;
  const totalRent = monthlyRent * monthCount;
  const deposit = monthlyRent;
  const serviceFee = 2000;
  const totalDue = deposit + serviceFee;

  return (
    <div className="lg:col-span-4">
      <div className="sticky top-24 bg-bg-card border border-border-default rounded-xl shadow-sm p-space-6 flex flex-col gap-space-5">
        {/* Price Header */}
        <div className="flex items-baseline gap-2 border-b border-border-default pb-space-4">
          <h3 className="font-h3 text-h3 text-primary-deep">PKR {monthlyRent.toLocaleString()}</h3>
          <span className="text-text-muted font-body-default">/ month</span>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-space-4">
          {/* Room Type Select */}
          <div className="flex flex-col gap-1">
            <label className="font-label text-label text-text-heading">Select Room Type</label>
            <div className="relative">
              <select
                value={selectedRoomType}
                onChange={(e) => onRoomTypeChange(e.target.value)}
                className="w-full appearance-none bg-surface border border-border-default rounded-lg px-space-3 py-2 text-text-body focus:ring-2 focus:ring-primary-container focus:border-primary-container h-[42px]"
              >
                <option>Double Shared - PKR 30,000</option>
                <option>Single Executive - PKR 45,000</option>
                <option>Triple Shared - PKR 22,000</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* Date and Duration */}
          <div className="grid grid-cols-2 gap-space-3">
            <div className="flex flex-col gap-1">
              <label className="font-label text-label text-text-heading">Move-in Date</label>
              <input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="w-full bg-surface border border-border-default rounded-lg px-space-3 py-2 text-text-body focus:ring-2 focus:ring-primary-container focus:border-primary-container h-[42px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label text-label text-text-heading">Duration</label>
              <div className="relative">
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full appearance-none bg-surface border border-border-default rounded-lg px-space-3 py-2 text-text-body focus:ring-2 focus:ring-primary-container focus:border-primary-container h-[42px]"
                >
                  <option>1 Month</option>
                  <option>6 Months</option>
                  <option>12 Months</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-surface-container rounded-lg p-space-4 flex flex-col gap-space-2">
          <div className="flex justify-between text-sm text-text-body">
            <span>Rent (x{monthCount} months)</span>
            <span>PKR {totalRent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-text-body">
            <span>Security Deposit (Refundable)</span>
            <span>PKR {deposit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-text-body">
            <span>Service Fee</span>
            <span>PKR {serviceFee.toLocaleString()}</span>
          </div>
          <div className="border-t border-border-default pt-space-2 mt-space-1 flex justify-between font-label text-label text-text-heading">
            <span>Total Due Now</span>
            <span className="text-primary-deep">PKR {totalDue.toLocaleString()}</span>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full bg-action hover:bg-action-pressed text-on-primary font-label text-label py-3 rounded-lg shadow-sm active:scale-95 transition-all duration-150 flex justify-center items-center gap-2">
          Request Booking
        </button>
        <p className="text-center text-xs text-text-muted">You won't be charged yet.</p>
      </div>
    </div>
  );
}
