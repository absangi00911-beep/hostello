'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Home,
  Calendar,
  MessageCircle,
  HelpCircle,
  LogOut,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Building,
  Clock,
  AlertCircle as PendingIcon,
  TrendingUp as InsightsIcon,
  Plus,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';
import { PrimaryButton, SecondaryButton, IconButton } from '@/components/ui';

interface BookingRequest {
  id: string;
  studentName: string;
  hostelName: string;
  roomType: string;
  dateRange: string;
  total: number;
  status: 'pending' | 'confirmed' | 'declined';
}

interface OwnerDashboardResponsiveProps {
  stats?: {
    listings: number;
    activeBookings: number;
    pendingRequests: number;
    monthlyInquiries: number;
  };
  requests?: BookingRequest[];
  onAddListing?: () => void;
  onConfirmRequest?: (requestId: string) => void;
  onDeclineRequest?: (requestId: string) => void;
  ownerName?: string;
  isVerified?: boolean;
}

const DEFAULT_STATS = {
  listings: 3,
  activeBookings: 12,
  pendingRequests: 5,
  monthlyInquiries: 48,
};

const DEFAULT_REQUESTS: BookingRequest[] = [
  {
    id: '1',
    studentName: 'Ali Khan',
    hostelName: 'Sunshine Boys Hostel',
    roomType: 'Double Shared',
    dateRange: 'Sep 1 - Feb 28',
    total: 90000,
    status: 'pending',
  },
  {
    id: '2',
    studentName: 'Sara Ahmed',
    hostelName: 'Green Leaf Girls Hostel',
    roomType: 'Single Private',
    dateRange: 'Aug 15 - Dec 15',
    total: 120000,
    status: 'pending',
  },
  {
    id: '3',
    studentName: 'Bilal Qureshi',
    hostelName: 'Sunshine Boys Hostel',
    roomType: 'Triple Shared',
    dateRange: 'Sep 1 - Jan 31',
    total: 65000,
    status: 'pending',
  },
];

export function OwnerDashboardResponsive({
  stats = DEFAULT_STATS,
  requests = DEFAULT_REQUESTS,
  onAddListing,
  onConfirmRequest,
  onDeclineRequest,
  ownerName = 'Property Manager',
  isVerified = true,
}: OwnerDashboardResponsiveProps) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen bg-bg-page text-text-body font-body-default">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-60 h-screen sticky left-0 top-0 border-r border-border-default shadow-[4px_0_24px_rgba(194,139,26,0.05)] bg-bg-card flex-col p-space-4 gap-space-2 z-40">
        {/* Header */}
        <div className="flex items-center gap-space-3 mb-space-6 px-space-2 mt-space-2">
          <div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden flex-shrink-0">
            <img
              alt="Hostel Manager"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTm6BwYtY_KSSX5yv-MIbs5jn5ZIiD6RgLoY91F4MqELYGZK_gMA8ojREphB4j6MDTNud6IBf3eRXbWMnDGoYUVQYNOQL0js264dpPOtaRp9mvU2J7zZ2U6K23o-VAjg-Ght6nEiSw2vVRUPCZbXgAki3ltb6CcESGIktUiX244xAmwucpHP12aWoXY7Zb3gOWgesvBQmEk4DZ3x_p7uOhsYzQNq6vQUhqN0SMHcA6Zvh6hhpnG3L9Fsho9HsdM8Z78iHmMXLccNUh"
            />
          </div>
          <div>
            <p className="font-label text-label text-text-heading">{ownerName}</p>
            {isVerified && (
              <p className="font-overline text-overline text-success flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified Owner
              </p>
            )}
          </div>
        </div>

        <div className="px-space-2 mb-space-4">
          <p className="font-display text-lg font-black text-emerald-900">HostelHub</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'listings', label: 'Listings', icon: Building },
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href="#"
              onClick={() => setActiveNav(id)}
              className={`flex items-center gap-space-3 px-space-3 py-space-2 rounded-lg font-h3 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                activeNav === id
                  ? 'bg-emerald-900 text-white shadow-md'
                  : 'text-stone-600 hover:text-emerald-900 hover:translate-x-1'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="mt-auto mb-space-4 px-space-2">
          <PrimaryButton className="w-full">
            Add New Hostel
          </PrimaryButton>
        </div>

        {/* Footer Links */}
        <div className="flex flex-col gap-1 border-t border-border-default pt-space-4">
          {[
            { id: 'help', label: 'Help Center', icon: HelpCircle },
            { id: 'logout', label: 'Sign Out', icon: LogOut },
          ].map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href="#"
              className="flex items-center gap-space-3 px-space-3 py-space-2 text-stone-600 hover:text-emerald-900 font-h3 text-sm font-medium hover:translate-x-1 transition-all duration-200 active:scale-[0.98]"
            >
              <Icon className="w-5 h-5" />
              {label}
            </a>
          ))}
        </div>
      </aside>

      {/* Bottom Nav - Mobile Only */}
      <nav className="fixed bottom-0 w-full z-50 md:hidden rounded-t-2xl border-t border-amber-200/50 shadow-[0_-4px_12px_rgba(194,139,26,0.1)] bg-bg-card flex justify-around items-center h-20 pb-safe px-space-4">
        {[
          { id: 'home', label: 'Home', icon: LayoutDashboard },
          { id: 'listings', label: 'Listings', icon: Home },
          { id: 'bookings', label: 'Bookings', icon: Calendar },
          { id: 'messages', label: 'Messages', icon: MessageCircle },
        ].map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href="#"
            onClick={() => setActiveNav(id)}
            className={`flex flex-col items-center justify-center font-h3 text-[10px] font-bold uppercase tracking-wider scale-110 transition-transform duration-200 px-space-3 py-1 rounded-xl ${
              activeNav === id
                ? 'text-emerald-900 bg-amber-100/50'
                : 'text-stone-400 active:bg-amber-50'
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            {label}
          </a>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
        <div className="max-w-7xl w-full mx-auto px-space-4 md:px-space-8 py-space-6 md:py-space-8 flex-1">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-space-4 mb-space-8">
            <div>
              <h2 className="font-h2 text-h2 text-text-heading">Partner Dashboard</h2>
              <p className="font-body-default text-body-default text-text-muted mt-space-1">
                Welcome back. Here is an overview of your properties.
              </p>
            </div>
            <PrimaryButton
              onClick={onAddListing}
              className="flex items-center gap-space-2"
            >
              <Plus className="w-5 h-5" />
              Add New Listing
            </PrimaryButton>
          </header>

          {/* Stat Tiles */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4 mb-space-8">
            <div className="bg-bg-card p-space-5 rounded-lg border border-border-default shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex items-center gap-space-4">
              <div className="w-12 h-12 rounded-full bg-primary-faint flex items-center justify-center text-primary-deep">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <p className="font-label text-label text-text-muted">Total Listings</p>
                <p className="font-display text-[28px] leading-[1.1] font-bold text-text-heading mt-1">
                  {stats.listings}
                </p>
              </div>
            </div>

            <div className="bg-bg-card p-space-5 rounded-lg border border-border-default shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex items-center gap-space-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-success">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="font-label text-label text-text-muted">Active Bookings</p>
                <p className="font-display text-[28px] leading-[1.1] font-bold text-text-heading mt-1">
                  {stats.activeBookings}
                </p>
              </div>
            </div>

            <div className="bg-bg-card p-space-5 rounded-lg border border-warning/30 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex items-center gap-space-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-2 h-full bg-warning" />
              <div className="w-12 h-12 rounded-full bg-[#FEF4E1] flex items-center justify-center text-warning">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="font-label text-label text-text-muted">Pending Requests</p>
                <p className="font-display text-[28px] leading-[1.1] font-bold text-text-heading mt-1">
                  {stats.pendingRequests}
                </p>
              </div>
            </div>

            <div className="bg-bg-card p-space-5 rounded-lg border border-border-default shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex items-center gap-space-4">
              <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-info">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="font-label text-label text-text-muted">Monthly Inquiries</p>
                <p className="font-display text-[28px] leading-[1.1] font-bold text-text-heading mt-1">
                  {stats.monthlyInquiries}
                </p>
              </div>
            </div>
          </section>

          {/* Recent Booking Requests Table */}
          <section className="bg-bg-card rounded-xl border border-border-default shadow-sm overflow-hidden flex flex-col">
            <div className="px-space-5 py-space-4 border-b border-border-default bg-bg-raised flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-text-heading">Recent Booking Requests</h3>
              <button className="text-primary hover:text-primary-dark font-label text-label flex items-center gap-1 transition-colors">
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-bg-card border-b border-border-default">
                    <th className="py-space-3 px-space-5 font-overline text-overline text-text-muted uppercase tracking-wider sticky left-0 bg-bg-card z-10 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      Student Name
                    </th>
                    <th className="py-space-3 px-space-5 font-overline text-overline text-text-muted uppercase tracking-wider">
                      Hostel Name
                    </th>
                    <th className="py-space-3 px-space-5 font-overline text-overline text-text-muted uppercase tracking-wider">
                      Room Type
                    </th>
                    <th className="py-space-3 px-space-5 font-overline text-overline text-text-muted uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="py-space-3 px-space-5 font-overline text-overline text-text-muted uppercase tracking-wider">
                      Total (PKR)
                    </th>
                    <th className="py-space-3 px-space-5 font-overline text-overline text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-space-3 px-space-5 font-overline text-overline text-text-muted uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      onMouseEnter={() => setHoveredRowId(request.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className="hover:bg-bg-raised transition-colors group h-16"
                    >
                      <td className="py-space-3 px-space-5 font-body-default text-body-default text-text-heading font-medium sticky left-0 bg-bg-card group-hover:bg-bg-raised z-10">
                        {request.studentName}
                      </td>
                      <td className="py-space-3 px-space-5 font-body-default text-body-default text-text-body">
                        {request.hostelName}
                      </td>
                      <td className="py-space-3 px-space-5 font-body-default text-body-default text-text-body">
                        {request.roomType}
                      </td>
                      <td className="py-space-3 px-space-5 font-body-default text-body-default text-text-muted">
                        {request.dateRange}
                      </td>
                      <td className="py-space-3 px-space-5 font-body-default text-body-default text-text-heading font-medium">
                        {request.total.toLocaleString()}
                      </td>
                      <td className="py-space-3 px-space-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#FEF4E1] text-warning border border-warning/20">
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-space-3 px-space-5 text-right">
                        <div
                          className={`flex items-center justify-end gap-space-2 transition-opacity ${
                            hoveredRowId === request.id ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <button
                            onClick={() => onConfirmRequest?.(request.id)}
                            className="px-space-3 py-1.5 rounded border border-success text-success hover:bg-success hover:text-white font-label text-label transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => onDeclineRequest?.(request.id)}
                            className="px-space-3 py-1.5 rounded border border-error text-error hover:bg-error hover:text-white font-label text-label transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
