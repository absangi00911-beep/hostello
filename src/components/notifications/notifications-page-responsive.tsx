'use client';

import React, { useState } from 'react';
import {
  Home,
  ReceiptText,
  Building2,
  Bell,
  User,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Info,
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

interface NotificationsPageProps {
  onNavigation?: (path: string) => void;
  onMarkAllRead?: () => void;
  onNotificationClick?: (id: string) => void;
}

export default function NotificationsPageResponsive({
  onNavigation = () => {},
  onMarkAllRead = () => {},
  onNotificationClick = () => {},
}: NotificationsPageProps) {
  const [activeNav, setActiveNav] = useState('notifications');
  const [activeMobileNav, setActiveMobileNav] = useState('alerts');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Booking Confirmed!',
      description: 'Your stay at Sunny Dorms from Oct 12 to Oct 15 is confirmed. View details to prep for your trip.',
      timestamp: '2 hours ago',
      isRead: false,
      icon: <CheckCircle className="w-5 h-5" />,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      id: '2',
      title: 'Price Alert: Downtown Hostel',
      description:
        'The price for standard rooms at Downtown Hostel has dropped by 10% for your tracked dates.',
      timestamp: '5 hours ago',
      isRead: false,
      icon: <AlertCircle className="w-5 h-5" />,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
    },
    {
      id: '3',
      title: 'New Message from Host',
      description: '"Hi! We are ready for your arrival. Let us know if you need an early check-in."',
      timestamp: 'Yesterday',
      isRead: true,
      icon: <MessageCircle className="w-5 h-5" />,
      iconBg: 'bg-surface-dim',
      iconColor: 'text-text-muted',
    },
    {
      id: '4',
      title: 'System Maintenance',
      description:
        'HostelLo will undergo scheduled maintenance on Sunday at 2 AM. Expect brief downtime.',
      timestamp: 'Oct 8, 2023',
      isRead: true,
      icon: <Info className="w-5 h-5" />,
      iconBg: 'bg-surface-dim',
      iconColor: 'text-text-muted',
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({
        ...notif,
        isRead: true,
      })),
    );
    onMarkAllRead();
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <ReceiptText className="w-5 h-5" /> },
    { id: 'hostels', label: 'Hostels', icon: <Building2 className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  ];

  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
    { id: 'hostels', label: 'Hostels', icon: <Building2 className="w-6 h-6" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-6 h-6" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
  ];

  return (
    <div className="bg-bg-page text-on-surface min-h-screen font-body-default text-body-default flex flex-col md:flex-row">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <nav className="fixed left-0 top-0 h-screen w-60 hidden md:flex flex-col bg-bg-raised border-r border-border-default z-50">
        <div className="flex flex-col py-8 px-4 space-y-2 h-full">
          {/* Branding */}
          <div className="mb-8 px-4">
            <span className="font-h1 text-h1 text-2xl font-black text-primary-container">
              HostelLo
            </span>
            <p className="font-label text-label text-text-muted mt-1">Student Portal</p>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  onNavigation(item.id);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all font-h2 text-[13px] tracking-wide uppercase font-semibold ${
                  activeNav === item.id
                    ? 'bg-primary-faint text-primary-deep border-r-4 border-primary-container'
                    : 'text-text-muted hover:text-primary-container hover:bg-surface-container'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Footer Navigation */}
          <div className="mt-auto space-y-1">
            <button
              onClick={() => {
                setActiveNav('profile');
                onNavigation('profile');
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all font-h2 text-[13px] tracking-wide uppercase font-semibold ${
                activeNav === 'profile'
                  ? 'bg-primary-faint text-primary-deep border-r-4 border-primary-container'
                  : 'text-text-muted hover:text-primary-container hover:bg-surface-container'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="ml-3">Profile</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MOBILE TOP HEADER ===== */}
      <header className="md:hidden flex justify-between items-center px-6 w-full z-40 bg-bg-card border-b border-border-default shadow-sm shadow-primary-container/5 fixed top-0 h-16">
        <span className="text-xl font-bold tracking-tight text-text-heading font-h2 text-sm font-medium">
          HostelLo
        </span>
        <div className="flex items-center gap-4 text-primary-container">
          <Bell className="w-5 h-5" />
        </div>
      </header>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="flex-1 md:ml-60 pt-20 md:pt-8 px-4 sm:px-6 md:px-8 pb-32 md:pb-8 max-w-[1024px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-h2 text-h2 text-text-heading">Notifications</h1>
            <p className="font-body-default text-body-default text-text-muted mt-1">
              Stay updated with your bookings and alerts.
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="font-label text-label text-primary font-medium hover:text-primary-dark transition-colors px-4 py-2 rounded-lg hover:bg-primary-faint/50 self-start sm:self-auto border border-transparent focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg-page focus:outline-none"
          >
            Mark all as read
          </button>
        </div>

        {/* Notification List */}
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onNotificationClick(notif.id)}
              className={`rounded-xl p-4 md:p-6 flex gap-4 items-start shadow-sm hover:shadow transition-shadow border border-border-default relative group cursor-pointer ${
                notif.isRead ? 'bg-bg-card' : 'bg-primary-faint'
              }`}
            >
              {/* Unread Indicator */}
              {!notif.isRead && (
                <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-warning" />
              )}

              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.iconBg} ${notif.iconColor}`}
              >
                {notif.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1 pr-6">
                  <h3
                    className={`font-h3 text-h3 text-base ${
                      notif.isRead ? 'font-medium text-text-muted' : 'text-text-heading'
                    }`}
                  >
                    {notif.title}
                  </h3>
                </div>
                <p
                  className={`font-body-default text-body-default mb-2 ${
                    notif.isRead ? 'text-text-muted' : 'text-text-body'
                  }`}
                >
                  {notif.description}
                </p>
                <span className="font-overline text-overline text-text-muted">
                  {notif.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white/90 backdrop-blur-md rounded-t-2xl border-t border-border-default shadow-[0_-4px_12px_rgba(194,139,26,0.08)]">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMobileNav(item.id);
              onNavigation(item.id);
            }}
            className={`flex flex-col items-center justify-center font-h2 text-[10px] font-bold scale-90 transition-transform rounded-xl px-4 py-1 ${
              activeMobileNav === item.id
                ? 'bg-primary-faint text-primary-deep'
                : 'text-text-muted active:bg-surface-container'
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
