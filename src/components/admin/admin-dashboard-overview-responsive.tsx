'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Home,
  Calendar,
  Star,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  ArrowUp,
  UserPlus,
  Building2,
  CreditCard,
  Flag,
  MoreVertical,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react';
import { PrimaryButton } from '@/components/ui';

interface AdminDashboardOverviewProps {
  onLogout?: () => void;
  onNotifications?: () => void;
  onNavigation?: (path: string) => void;
}

interface StatTile {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  secondaryText: string;
  secondaryIcon?: React.ReactNode;
  isHighlight?: boolean;
}

interface ActivityRow {
  id: string;
  eventType: string;
  icon: React.ReactNode;
  iconBg: string;
  entity: string;
  dateTime: string;
  status: string;
  statusColor: string;
}

export default function AdminDashboardOverviewResponsive({
  onLogout = () => {},
  onNotifications = () => {},
  onNavigation = () => {},
}: AdminDashboardOverviewProps) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeMobileNav, setActiveMobileNav] = useState('dashboard');

  const statTiles: StatTile[] = [
    {
      id: 'listings',
      label: 'Total Listings',
      value: '1,248',
      icon: <Home className="w-5 h-5" />,
      iconBg: 'bg-primary-faint',
      secondaryText: '12%',
      secondaryIcon: <ArrowUp className="w-3 h-3" />,
      isHighlight: false,
    },
    {
      id: 'reviews',
      label: 'Pending Reviews',
      value: '42',
      icon: <Star className="w-5 h-5" />,
      iconBg: 'bg-surface-container',
      secondaryText: 'Action needed',
      isHighlight: false,
    },
    {
      id: 'bookings',
      label: 'Active Bookings',
      value: '856',
      icon: <Calendar className="w-5 h-5" />,
      iconBg: 'bg-tertiary-fixed-dim/20',
      secondaryText: '5%',
      secondaryIcon: <ArrowUp className="w-3 h-3" />,
      isHighlight: false,
    },
    {
      id: 'issues',
      label: 'Reported Issues',
      value: '7',
      icon: <Flag className="w-5 h-5" />,
      iconBg: 'bg-error-container',
      secondaryText: 'Urgent',
      isHighlight: true,
    },
  ];

  const activityRows: ActivityRow[] = [
    {
      id: '1',
      eventType: 'New Registration',
      icon: <UserPlus className="w-4 h-4" />,
      iconBg: 'bg-primary-faint',
      entity: 'John Doe (Host)',
      dateTime: 'Oct 24, 10:42 AM',
      status: 'COMPLETED',
      statusColor: 'bg-secondary-container text-on-secondary-container',
    },
    {
      id: '2',
      eventType: 'Listing Submission',
      icon: <Building2 className="w-4 h-4" />,
      iconBg: 'bg-surface-container',
      entity: 'Sunrise Backpackers',
      dateTime: 'Oct 24, 09:15 AM',
      status: 'PENDING',
      statusColor: 'bg-primary-faint text-primary-dark',
    },
    {
      id: '3',
      eventType: 'Payment Confirmation',
      icon: <CreditCard className="w-4 h-4" />,
      iconBg: 'bg-tertiary-fixed-dim/20',
      entity: 'Booking #BK-9021',
      dateTime: 'Oct 23, 16:30 PM',
      status: 'COMPLETED',
      statusColor: 'bg-secondary-container text-on-secondary-container',
    },
    {
      id: '4',
      eventType: 'Reported Issue',
      icon: <Flag className="w-4 h-4" />,
      iconBg: 'bg-error-container',
      entity: 'User: @travel_bug',
      dateTime: 'Oct 23, 14:10 PM',
      status: 'OPEN',
      statusColor: 'bg-error-container text-error',
    },
    {
      id: '5',
      eventType: 'Listing Submission',
      icon: <Building2 className="w-4 h-4" />,
      iconBg: 'bg-surface-container',
      entity: 'Downtown Urban Stay',
      dateTime: 'Oct 23, 11:05 AM',
      status: 'PENDING',
      statusColor: 'bg-primary-faint text-primary-dark',
    },
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'listings', label: 'Listings', icon: <Home className="w-5 h-5" /> },
    { id: 'bookings', label: 'All Bookings', icon: <Calendar className="w-5 h-5" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="w-5 h-5" /> },
    { id: 'settings', label: 'System Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const footerItems = [
    { id: 'support', label: 'Support', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'logout', label: 'Logout', icon: <LogOut className="w-5 h-5" />, isError: true },
  ];

  return (
    <div className="bg-bg-page text-text-body font-body-default min-h-screen flex flex-col md:flex-row">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[240px] border-r border-border-default shadow-[4px_0_24px_-12px_rgba(194,139,26,0.15)] bg-bg-page z-50">
        {/* Branding */}
        <div className="px-space-6 py-space-6 flex items-center gap-space-3 border-b border-border-default">
          <LayoutGrid className="w-6 h-6 text-primary-container" />
          <div>
            <h1 className="font-h3 text-h3 text-text-heading tracking-tighter">HostelHub Admin</h1>
            <p className="font-label text-label text-text-muted">Marketplace Manager</p>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 py-space-6 overflow-y-auto">
          <ul className="space-y-space-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveNav(item.id);
                    onNavigation(item.id);
                  }}
                  className={`w-full flex items-center gap-space-3 px-space-4 py-space-3 font-label text-label transition-colors border-r-4 ${
                    activeNav === item.id
                      ? 'bg-bg-raised text-primary-container border-primary-container'
                      : 'text-text-muted hover:bg-bg-raised border-transparent'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Navigation */}
        <div className="p-space-4 border-t border-border-default">
          <ul className="space-y-space-1">
            {footerItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.id === 'logout') {
                      onLogout();
                    } else {
                      onNavigation(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-space-3 px-space-4 py-space-3 font-label text-label transition-colors rounded ${
                    item.isError
                      ? 'text-error hover:bg-error-container'
                      : 'text-text-muted hover:bg-bg-raised'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col md:ml-[240px] min-h-screen">
        {/* TOP APP BAR */}
        <header className="sticky top-0 z-40 w-full border-b border-border-default bg-[#FEFCF8]/80 backdrop-blur-md shadow-sm h-16 flex justify-between items-center px-space-4 md:px-space-8">
          {/* Mobile Icon */}
          <div className="flex items-center md:hidden gap-space-3">
            <LayoutGrid className="w-6 h-6 text-primary-container" />
            <span className="font-h3 text-h3 text-text-heading">Admin</span>
          </div>

          {/* Desktop Title */}
          <div className="hidden md:flex items-center gap-space-4">
            <h2 className="font-h2 text-h2 text-text-heading">Dashboard Overview</h2>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-space-4">
            <button
              onClick={onNotifications}
              className="text-text-muted hover:text-text-heading transition-colors focus:ring-2 focus:ring-primary-light/50 outline-none p-2 rounded-full"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-surface-dim border border-border-strong overflow-hidden flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-primary-light to-primary-faint" />
            </div>
          </div>
        </header>

        {/* MAIN CANVAS */}
        <main className="flex-1 p-space-4 md:p-space-8 max-w-[1280px] mx-auto w-full">
          {/* Mobile Title */}
          <div className="md:hidden mb-space-6">
            <h2 className="font-h2 text-h2 text-text-heading">Dashboard Overview</h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4 md:gap-space-6 mb-space-8">
            {statTiles.map((tile) => (
              <div
                key={tile.id}
                className={`bg-bg-card border ${
                  tile.isHighlight ? 'border-error/30' : 'border-border-default'
                } rounded-lg p-space-5 shadow-sm hover:-translate-y-[2px] transition-transform duration-200`}
              >
                <div className="flex justify-between items-start mb-space-2">
                  <span className="font-label text-label text-text-muted">{tile.label}</span>
                  <div
                    className={`${tile.iconBg} p-1 rounded flex items-center justify-center ${
                      tile.isHighlight ? 'text-error' : 'text-primary-container'
                    }`}
                  >
                    {tile.icon}
                  </div>
                </div>
                <div className="flex items-baseline gap-space-2">
                  <span
                    className={`font-h1 text-h1 ${
                      tile.isHighlight ? 'text-error' : 'text-text-heading'
                    }`}
                  >
                    {tile.value}
                  </span>
                  <span
                    className={`font-overline text-overline flex items-center ${
                      tile.id === 'reviews'
                        ? 'text-text-muted'
                        : tile.isHighlight
                          ? 'text-error'
                          : 'text-success'
                    }`}
                  >
                    {tile.secondaryIcon && <span className="mr-1">{tile.secondaryIcon}</span>}
                    {tile.secondaryText}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity Table Section */}
          <div className="bg-bg-card border border-border-default rounded-lg shadow-sm overflow-hidden">
            <div className="px-space-6 py-space-5 border-b border-border-default flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-text-heading">Recent Activity</h3>
              <button className="font-label text-label text-primary-container hover:text-primary-deep transition-colors">
                View All
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border-default">
                    <th className="py-space-3 px-space-6 font-overline text-overline text-text-muted uppercase tracking-wider sticky left-0 bg-surface-container-low z-10">
                      Event Type
                    </th>
                    <th className="py-space-3 px-space-6 font-overline text-overline text-text-muted uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="py-space-3 px-space-6 font-overline text-overline text-text-muted uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="py-space-3 px-space-6 font-overline text-overline text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-space-3 px-space-6 font-overline text-overline text-text-muted uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {activityRows.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-bright transition-colors group">
                      <td className="py-space-4 px-space-6 sticky left-0 bg-bg-card group-hover:bg-surface-bright z-10">
                        <div className="flex items-center gap-space-3">
                          <div
                            className={`${row.iconBg} w-8 h-8 rounded-full flex items-center justify-center ${
                              row.eventType === 'Reported Issue' ? 'text-error' : 'text-primary-container'
                            }`}
                          >
                            {row.icon}
                          </div>
                          <span className="font-body-default text-body-default text-text-heading font-medium">
                            {row.eventType}
                          </span>
                        </div>
                      </td>
                      <td className="py-space-4 px-space-6 font-body-default text-body-default text-text-body">
                        {row.entity}
                      </td>
                      <td className="py-space-4 px-space-6 font-body-default text-body-default text-text-muted">
                        {row.dateTime}
                      </td>
                      <td className="py-space-4 px-space-6">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wide ${row.statusColor}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-space-4 px-space-6 text-right">
                        <button className="text-text-muted hover:text-text-heading transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-space-6 py-space-4 border-t border-border-default bg-surface-bright flex justify-center">
              <button className="font-label text-label text-text-muted hover:text-text-heading transition-colors flex items-center gap-1">
                Load More <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 border-t border-border-default bg-bg-card shadow-[0_-4px_12px_rgba(194,139,26,0.08)] flex justify-around items-center h-16 px-space-4 pb-safe">
        {[
          { id: 'dashboard', label: 'Dash', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'listings', label: 'Listings', icon: <Home className="w-5 h-5" /> },
          { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-5 h-5" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMobileNav(item.id);
              onNavigation(item.id);
            }}
            className={`flex flex-col items-center justify-center rounded-xl px-space-3 py-1 tap-highlight-transparent active:scale-90 transition-transform ${
              activeMobileNav === item.id
                ? 'text-primary-container bg-primary-faint'
                : 'text-text-muted'
            }`}
          >
            {item.icon}
            <span className="text-[11px] font-bold font-h2 mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
