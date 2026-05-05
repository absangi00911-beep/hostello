'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Bell,
  Calendar,
  MessageSquare,
  Wallet,
  HelpCircle,
  Search,
  Settings,
  LogOut,
  X,
  MapPin,
  Home,
  Bookmark,
  User,
} from 'lucide-react';

interface PriceAlertDrawerProps {
  onSetAlert?: (data: { hostel: string; targetPrice: number; emailNotification: boolean }) => void;
  onClose?: () => void;
  onNavigation?: (path: string) => void;
  onFindRoom?: () => void;
}

export default function PriceAlertDrawerResponsive({
  onSetAlert = () => {},
  onClose = () => {},
  onNavigation = () => {},
  onFindRoom = () => {},
}: PriceAlertDrawerProps) {
  const [activeSidebarItem, setActiveSidebarItem] = useState('price-alerts');
  const [activeMobileNav, setActiveMobileNav] = useState('alerts');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState('Sunset View Boys Hostel');
  const [targetPrice, setTargetPrice] = useState('26000');
  const [emailAlertEnabled, setEmailAlertEnabled] = useState(true);
  const [hostelSearch, setHostelSearch] = useState('');

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'price-alerts', label: 'Price Alerts', icon: <Bell className="w-5 h-5" /> },
    { id: 'bookings', label: 'My Bookings', icon: <Calendar className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <Wallet className="w-5 h-5" /> },
    { id: 'support', label: 'Support', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  const bottomSidebarItems = [
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'logout', label: 'Logout', icon: <LogOut className="w-5 h-5" /> },
  ];

  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <Bookmark className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const handleSetAlert = () => {
    onSetAlert({
      hostel: selectedHostel,
      targetPrice: parseInt(targetPrice),
      emailNotification: emailAlertEnabled,
    });
    setDrawerOpen(false);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    onClose();
  };

  return (
    <div className="bg-bg-page text-on-surface font-body-default min-h-screen flex">
      {/* ===== DESKTOP SIDEBAR NAVIGATION ===== */}
      <nav className="hidden lg:flex flex-col fixed left-0 top-0 h-full p-4 bg-bg-card text-on-surface font-body-default text-sm h-screen w-60 border-r border-border-default z-10">
        {/* Sidebar Header */}
        <div className="text-xl font-bold text-primary-container mb-8 px-2">Student Portal</div>

        {/* Main Navigation */}
        <ul className="flex-1 space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveSidebarItem(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light/50 ${
                  activeSidebarItem === item.id
                    ? 'bg-bg-raised text-primary-container font-semibold border-r-4 border-primary-container'
                    : 'text-text-muted hover:bg-bg-raised hover:text-text-heading hover:translate-x-1'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Find a Room Button */}
        <button
          onClick={onFindRoom}
          className="w-full bg-action hover:bg-action-pressed text-on-primary font-label py-3 rounded shadow-sm mb-6 flex items-center justify-center gap-2 transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-action/50"
        >
          <Search className="w-4.5 h-4.5" />
          Find a Room
        </button>

        {/* Bottom Navigation */}
        <ul className="space-y-2">
          {bottomSidebarItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveSidebarItem(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded text-text-muted hover:bg-bg-raised hover:text-text-heading hover:translate-x-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light/50"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ===== MAIN CONTENT AREA (Background) ===== */}
      <main className="flex-1 lg:ml-60 p-4 lg:p-8 w-full min-h-screen">
        <div className="max-w-7xl mx-auto opacity-50 pointer-events-none">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="font-h1 text-h1 text-text-heading">Price Alerts</h1>
              <p className="font-body-default text-body-default text-text-muted mt-1">
                Manage your target prices for monitored hostels.
              </p>
            </div>
            <button className="bg-action text-on-primary px-4 py-2 rounded shadow-sm font-label flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-action/50">
              <Search className="w-4.5 h-4.5" />
              New Alert
            </button>
          </header>

          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-bg-card rounded-lg border border-border-default p-4 shadow-sm flex flex-col gap-4"
              >
                <div className="h-32 bg-border-default rounded animate-pulse"></div>
                <div className="h-6 w-3/4 bg-border-default rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-border-default rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ===== DRAWER OVERLAY ===== */}
      {drawerOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={handleCloseDrawer}
        />
      )}

      {/* ===== SLIDE-IN DRAWER ===== */}
      <aside
        aria-labelledby="drawer-title"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-bg-card shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border-default ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
      >
        {/* Drawer Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-border-default bg-bg-card">
          <h2 className="font-h3 text-h3 text-text-heading" id="drawer-title">
            Add Price Alert
          </h2>
          <button
            aria-label="Close panel"
            className="text-text-muted hover:text-text-heading transition-colors rounded p-1 focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 focus:ring-offset-bg-card"
            type="button"
            onClick={handleCloseDrawer}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Hostel Selection */}
          <div>
            <label className="block font-label text-label text-text-heading mb-2" htmlFor="hostel-search">
              Select a Hostel
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-text-muted" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-border-strong rounded bg-surface text-text-body font-body-default focus:ring-2 focus:ring-primary-container focus:border-primary-container h-[42px] transition-shadow placeholder:text-text-placeholder"
                id="hostel-search"
                placeholder="e.g. Sunset View"
                type="text"
                value={hostelSearch}
                onChange={(e) => setHostelSearch(e.target.value)}
              />
            </div>

            {/* Selected Hostel Card */}
            <div className="mt-2 p-3 bg-bg-raised border border-border-default rounded flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-surface-dim overflow-hidden flex-shrink-0" />
                <div>
                  <p className="font-label text-label text-text-heading">{selectedHostel}</p>
                  <p className="font-body-default text-xs text-text-muted flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Johar Town, Lahore
                  </p>
                </div>
              </div>
              <button
                className="text-text-muted hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-error/50 rounded p-1"
                onClick={() => setSelectedHostel('')}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <hr className="border-border-default" />

          {/* Price Comparison Section */}
          <div className="bg-surface-container-low rounded-lg p-4 border border-border-default flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-label text-label text-text-muted">Current Price</span>
              <div className="flex items-baseline gap-1">
                <span className="font-h3 text-h3 text-primary-deep">Rs 28,000</span>
                <span className="text-body-default font-body-default text-text-muted">/mo</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-label text-label text-text-muted">Historical Low</span>
              <span className="font-body-default text-text-body">Rs 25,500</span>
            </div>
          </div>

          {/* Target Price Input */}
          <div>
            <label className="block font-label text-label text-text-heading mb-2" htmlFor="target-price">
              Target Price (PKR)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="font-label text-label text-text-muted">Rs</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-border-strong rounded bg-surface text-text-body font-body-default focus:ring-2 focus:ring-primary-container focus:border-primary-container h-[42px] transition-shadow"
                id="target-price"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
            <p className="mt-2 font-body-default text-xs text-text-muted">
              We'll notify you when the price drops to or below this amount.
            </p>
          </div>

          {/* Notification Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="font-label text-label text-text-heading cursor-pointer">
                Alert via Email
              </label>
              <p className="font-body-default text-xs text-text-muted mt-0.5">
                Receive notifications at student@university.edu
              </p>
            </div>

            {/* Custom Toggle Switch */}
            <button
              aria-checked={emailAlertEnabled}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 ${
                emailAlertEnabled ? 'bg-action' : 'bg-surface-variant'
              }`}
              role="switch"
              type="button"
              onClick={() => setEmailAlertEnabled(!emailAlertEnabled)}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  emailAlertEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-border-default px-6 py-4 bg-bg-raised flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded border border-border-strong text-text-heading font-label hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 focus:ring-offset-bg-raised"
            type="button"
            onClick={handleCloseDrawer}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 rounded bg-action text-on-primary font-label hover:bg-action-pressed transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2 focus:ring-offset-bg-raised flex items-center gap-2 shadow-sm"
            type="button"
            onClick={handleSetAlert}
          >
            <Bell className="w-4.5 h-4.5" />
            Set Alert
          </button>
        </div>
      </aside>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 pb-safe bg-white/95 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest z-40 border-t rounded-t-lg border-border-default shadow-[0_-4px_16px_rgba(194,139,26,0.08)]">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMobileNav(item.id);
              onNavigation(item.id);
            }}
            className={`flex flex-col items-center justify-center transition-colors duration-200 focus:outline-none ${
              activeMobileNav === item.id
                ? 'text-primary-container scale-110'
                : 'text-text-muted hover:text-text-heading'
            }`}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
