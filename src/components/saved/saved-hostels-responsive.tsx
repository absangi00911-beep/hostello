'use client';

import React, { useState } from 'react';
import { Bell, HelpCircle, Bookmark, Home, List, Heart, User } from 'lucide-react';
import { PrimaryButton } from '@/components/ui';

interface SavedHostelsProps {
  onExplore?: () => void;
  onTabChange?: (tab: string) => void;
  onNavigation?: (path: string) => void;
}

export default function SavedHostelsResponsive({
  onExplore = () => {},
  onTabChange = () => {},
  onNavigation = () => {},
}: SavedHostelsProps) {
  const [activeTab, setActiveTab] = useState('saved-hostels');
  const [activeMobileNav, setActiveMobileNav] = useState('saved');

  const tabs = [
    { id: 'bookings', label: 'My Bookings' },
    { id: 'saved-hostels', label: 'Saved Hostels' },
    { id: 'messages', label: 'Messages' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange(tabId);
  };

  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <List className="w-5 h-5" /> },
    { id: 'saved', label: 'Saved', icon: <Heart className="w-5 h-5" />, isFilled: true },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-bg-page text-on-surface min-h-screen flex flex-col font-body-default">
      {/* ===== TOP NAVIGATION BAR ===== */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-white/80 backdrop-blur-md border-b border-border-default shadow-sm bg-bg-page">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight text-text-heading">HostelHub</span>
        </div>
        <div className="flex items-center gap-4 text-primary-container">
          <button
            aria-label="notifications"
            className="p-2 hover:bg-surface-container transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-light/50"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            aria-label="help"
            className="p-2 hover:bg-surface-container transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-light/50"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border-default ml-2 bg-primary-faint flex-shrink-0" />
        </div>
      </header>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="flex-grow pt-[88px] pb-24 md:pb-12 flex flex-col items-center max-w-[1280px] mx-auto w-full px-4 md:px-8">
        {/* Horizontal Navigation Tabs */}
        <nav className="w-full max-w-3xl flex justify-center md:justify-start gap-6 border-b border-border-default mb-16 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-2 font-label text-label transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-light/50 rounded px-2 py-1 ${
                activeTab === tab.id
                  ? 'text-text-heading font-semibold border-b-2 border-primary-container'
                  : 'text-text-muted hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Empty State Container */}
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-md mx-auto text-center py-16">
          {/* Bookmark Icon */}
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6 shadow-sm border border-border-default">
            <Bookmark className="w-10 h-10 text-text-muted" />
          </div>

          {/* Heading */}
          <h2 className="font-h2 text-h2 text-text-heading mb-2">Nothing saved</h2>

          {/* Description */}
          <p className="font-body-default text-body-default text-text-body mb-8 max-w-sm">
            Tap the bookmark on any hostel to save it for later. Your saved places will appear
            here.
          </p>

          {/* Explore Button */}
          <PrimaryButton onClick={onExplore}>
            Explore Hostels
          </PrimaryButton>
        </div>
      </main>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white/95 backdrop-blur-sm border-t border-border-default shadow-[0_-4px_12px_rgba(194,139,26,0.08)] rounded-t-xl">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMobileNav(item.id);
              onNavigation(item.id);
            }}
            className={`flex flex-col items-center justify-center text-[10px] uppercase tracking-wider font-bold scale-90 active:scale-100 transition-transform p-2 rounded-lg ${
              activeMobileNav === item.id
                ? 'text-primary-container bg-primary-faint'
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
