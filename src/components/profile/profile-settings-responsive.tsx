'use client';

import React, { useState } from 'react';
import {
  Bell,
  HelpCircle,
  Search,
  ReceiptLong,
  Heart,
  Settings,
  ContactSupport,
  LogOut,
  Home,
  List,
  Camera,
} from 'lucide-react';

interface ProfileSettingsFormData {
  fullName: string;
  city: string;
  email: string;
  phone: string;
  bio: string;
}

interface ProfileSettingsProps {
  onNavigation?: (path: string) => void;
  onSaveChanges?: (formData: ProfileSettingsFormData) => void;
  onUploadPhoto?: () => void;
}

export default function ProfileSettingsResponsive({
  onNavigation = () => {},
  onSaveChanges = () => {},
  onUploadPhoto = () => {},
}: ProfileSettingsProps) {
  const [activeNav, setActiveNav] = useState('settings');
  const [activeMobileNav, setActiveMobileNav] = useState('profile');
  const [activeSection, setActiveSection] = useState('personal-info');
  const [formData, setFormData] = useState<ProfileSettingsFormData>({
    fullName: 'Alex Rivers',
    city: 'London',
    email: 'alex.rivers@university.edu',
    phone: '+44 7700 900077',
    bio: 'Second-year design student looking for a quiet place with good Wi-Fi.',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = () => {
    onSaveChanges(formData);
  };

  const sidebarItems = [
    { id: 'discover', label: 'Discover', icon: <Search className="w-5 h-5" /> },
    { id: 'bookings', label: 'My Bookings', icon: <ReceiptLong className="w-5 h-5" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const footerItems = [
    { id: 'help', label: 'Help Center', icon: <ContactSupport className="w-5 h-5" /> },
    { id: 'logout', label: 'Logout', icon: <LogOut className="w-5 h-5" /> },
  ];

  const miniNavItems = [
    { id: 'personal-info', label: 'Personal Info' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'danger-zone', label: 'Danger Zone' },
  ];

  return (
    <div className="bg-bg-page text-text-body font-body-default min-h-screen pt-16 lg:pl-60 pb-20 lg:pb-0">
      {/* ===== TOP NAVIGATION BAR ===== */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-white/80 backdrop-blur-md shadow-sm bg-bg-page border-b border-border-default">
        <div className="text-xl font-bold tracking-tight text-text-heading">HostelHub</div>
        <div className="flex items-center gap-4">
          <button className="text-text-muted hover:text-text-heading hover:bg-surface-container transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-light/50">
            <Bell className="w-5 h-5" />
          </button>
          <button className="text-text-muted hover:text-text-heading hover:bg-surface-container transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-light/50">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full border border-border-default bg-primary-faint flex-shrink-0" />
        </div>
      </nav>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full pt-20 pb-8 w-60 bg-bg-raised border-r border-border-default">
        {/* User Profile Section */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-border-default bg-primary-faint flex-shrink-0" />
          <div>
            <p className="font-bold text-text-heading">Alex Rivers</p>
            <p className="text-xs text-text-muted">Verified Student</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                onNavigation(item.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                activeNav === item.id
                  ? 'bg-surface-container-low text-text-heading border-r-4 border-primary-container'
                  : 'text-text-muted hover:bg-surface-container hover:text-text-heading hover:translate-x-1'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer Navigation */}
        <div className="px-4 space-y-1 mt-auto">
          {footerItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigation(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-surface-container hover:text-text-heading hover:translate-x-1 transition-all duration-200"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white/95 backdrop-blur-sm border-t border-border-default shadow-[0_-4px_12px_rgba(194,139,26,0.08)] rounded-t-xl">
        {[
          { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
          { id: 'bookings', label: 'Bookings', icon: <List className="w-5 h-5" /> },
          { id: 'saved', label: 'Saved', icon: <Heart className="w-5 h-5" /> },
          { id: 'profile', label: 'Profile', icon: <Settings className="w-5 h-5" /> },
        ].map((item) => (
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

      {/* ===== MAIN CONTENT CANVAS ===== */}
      <main className="max-w-[720px] mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="font-h1 text-h1 text-text-heading mb-2">Profile & Settings</h1>
          <p className="font-body-default text-body-default text-text-muted">
            Manage your account details and preferences.
          </p>
        </header>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start">
          {/* Sticky Mini-Navigation (Desktop) */}
          <nav className="hidden md:block sticky top-24 space-y-2">
            {miniNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`block w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                  activeSection === item.id
                    ? 'text-action bg-action-light'
                    : item.id === 'danger-zone'
                      ? 'text-error hover:bg-error-container hover:text-on-error-container'
                      : 'text-text-muted hover:bg-bg-raised hover:text-text-heading'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Personal Info Section */}
            {activeSection === 'personal-info' && (
              <section
                id="personal-info"
                className="bg-bg-card rounded-xl shadow-sm border border-border-default p-6 space-y-6"
              >
                <h2 className="font-h3 text-h3 text-text-heading border-b border-border-default pb-4">
                  Personal Info
                </h2>

                {/* Profile Photo Section */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-20 h-20 bg-primary-faint text-primary-deep rounded-full flex items-center justify-center font-h2 text-h2 font-bold border-2 border-border-default">
                      AR
                    </div>
                    <button
                      onClick={onUploadPhoto}
                      className="absolute bottom-0 right-0 bg-bg-card border border-border-default p-1.5 rounded-full shadow-sm text-text-muted hover:text-action transition-colors focus:outline-none focus:ring-2 focus:ring-action/50"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-label text-label text-text-heading mb-1">Profile Photo</p>
                    <p className="text-xs text-text-muted">JPG, GIF or PNG. Max size of 5MB.</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block font-label text-label text-text-heading">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full h-[42px] px-3 bg-bg-page border border-border-default rounded focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 transition-shadow text-text-body"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="block font-label text-label text-text-heading">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full h-[42px] px-3 bg-bg-page border border-border-default rounded focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 transition-shadow text-text-body"
                    />
                  </div>

                  {/* Email (Disabled) */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-label text-label text-text-heading">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full h-[42px] px-3 bg-bg-page border border-border-default rounded focus:outline-none text-text-muted cursor-not-allowed opacity-60"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-label text-label text-text-heading flex justify-between">
                      Phone Number
                      <a
                        href="#"
                        className="text-primary-container hover:underline font-semibold"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        Verify
                      </a>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full h-[42px] px-3 bg-bg-page border border-border-default rounded focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 transition-shadow text-text-body"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-label text-label text-text-heading">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-bg-page border border-border-default rounded focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 transition-shadow resize-none text-text-body"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveChanges}
                    className="bg-action text-on-primary px-6 h-[42px] rounded font-label text-label hover:bg-action-dark active:scale-[0.97] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-action/50"
                  >
                    Save Changes
                  </button>
                </div>
              </section>
            )}

            {/* Placeholder for Other Sections */}
            {activeSection !== 'personal-info' && (
              <section className="bg-bg-card rounded-xl shadow-sm border border-border-default p-6">
                <h2 className="font-h3 text-h3 text-text-heading">
                  {miniNavItems.find((item) => item.id === activeSection)?.label}
                </h2>
                <p className="text-text-muted mt-2">Section coming soon...</p>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
