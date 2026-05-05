'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Home,
  Calendar,
  MessageSquare,
  Star,
  MapPin,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  User,
  CheckCircle,
  ChevronDown,
  Plus,
  Minus,
  Navigation,
} from 'lucide-react';

interface Hostel {
  id: number;
  name: string;
  rating: number;
  location: string;
  price: number;
  amenities: string[];
  image: string;
  verified: boolean;
}

interface SearchResultsMapProps {
  onViewDetails?: (hostelId: number) => void;
  onNavigation?: (path: string) => void;
  onApplyFilters?: (filters: FilterState) => void;
}

interface FilterState {
  priceMin: string;
  priceMax: string;
  amenities: string[];
  rating: string | null;
}

export default function SearchResultsMapResponsive({
  onViewDetails = () => {},
  onNavigation = () => {},
  onApplyFilters = () => {},
}: SearchResultsMapProps) {
  const [activeSidebarItem, setActiveSidebarItem] = useState('listings');
  const [activeMobileNav, setActiveMobileNav] = useState('listings');
  const [mapViewEnabled, setMapViewEnabled] = useState(true);
  const [sortBy, setSortBy] = useState('recommended');
  const [filters, setFilters] = useState<FilterState>({
    priceMin: '',
    priceMax: '',
    amenities: [],
    rating: null,
  });

  const hostels: Hostel[] = [
    {
      id: 1,
      name: 'The Flying Pig Downtown',
      rating: 4.8,
      location: 'Nieuwendijk 100, Amsterdam',
      price: 45,
      amenities: ['Free Wi-Fi', 'Bar', 'Lockers'],
      image: 'https://via.placeholder.com/240x160',
      verified: true,
    },
    {
      id: 2,
      name: 'ClinkNOORD',
      rating: 4.5,
      location: 'Badhuiskade 3, Amsterdam',
      price: 38,
      amenities: ['Free Wi-Fi', 'Cafe', 'Events'],
      image: 'https://via.placeholder.com/240x160',
      verified: true,
    },
    {
      id: 3,
      name: 'Generator Amsterdam',
      rating: 4.2,
      location: 'Mauritskade 57, Amsterdam',
      price: 52,
      amenities: ['Free Wi-Fi', 'Park View'],
      image: 'https://via.placeholder.com/240x160',
      verified: false,
    },
  ];

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'listings', label: 'Listings', icon: <Home className="w-5 h-5" /> },
    { id: 'bookings', label: 'All Bookings', icon: <Calendar className="w-5 h-5" /> },
    { id: 'reviews', label: 'Reviews', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'system', label: 'System Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const bottomSidebarItems = [
    { id: 'support', label: 'Support', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'logout', label: 'Logout', icon: <LogOut className="w-5 h-5" /> },
  ];

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dash', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'listings', label: 'Listings', icon: <Home className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const amenityOptions = ['Free Wi-Fi', 'Breakfast Included', 'Pool'];
  const ratingOptions = ['4.5+', '4.0+'];

  const handleAmenityToggle = (amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  return (
    <div className="bg-bg-page text-on-surface font-body-default min-h-screen flex flex-col overflow-hidden">
      {/* ===== TOP APP BAR ===== */}
      <header className="sticky top-0 z-40 w-full border-b border-border-default shadow-sm bg-bg-card/80 backdrop-blur-md flex justify-between items-center px-8 h-16 md:ml-60">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-text-heading font-h2">Management Console</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Map View Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <span className="font-label text-label text-text-muted">Map View</span>
            <button
              onClick={() => setMapViewEnabled(!mapViewEnabled)}
              className={`w-10 h-6 rounded-full relative flex items-center p-1 transition-colors outline-none focus:ring-2 focus:ring-primary-container/50 ${
                mapViewEnabled ? 'bg-primary-container' : 'bg-surface-variant'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                  mapViewEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <button className="text-text-muted hover:text-text-heading focus:ring-2 focus:ring-primary-container/50 outline-none p-2 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Account */}
          <button className="text-text-muted hover:text-text-heading focus:ring-2 focus:ring-primary-container/50 outline-none p-2 rounded-full transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ===== SIDEBAR NAVIGATION ===== */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-60 border-r border-border-default shadow-lg bg-bg-page z-50 flex-col py-6 mt-0">
        {/* Sidebar Header */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden border border-border-default flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-text-heading tracking-tight">HostelHub Admin</span>
            <span className="font-label text-label text-text-muted">Marketplace Manager</span>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSidebarItem(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light/50 ${
                activeSidebarItem === item.id
                  ? 'bg-bg-raised text-primary-container font-semibold border-r-4 border-primary-container'
                  : 'text-text-muted hover:bg-bg-raised hover:text-text-heading hover:scale-[0.98] active:scale-95'
              }`}
            >
              {item.icon}
              <span className="font-label text-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="px-4 mt-auto space-y-1">
          {bottomSidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSidebarItem(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted hover:bg-bg-raised hover:text-text-heading transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light/50 hover:scale-[0.98] active:scale-95"
            >
              {item.icon}
              <span className="font-label text-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="flex-1 flex md:ml-60 relative overflow-hidden">
        {/* ===== FILTER SIDEBAR (Desktop) ===== */}
        <aside className="w-70 shrink-0 border-r border-border-default bg-bg-card p-6 flex flex-col gap-6 overflow-y-auto h-[calc(100vh-64px)] hidden lg:flex">
          <h2 className="font-h3 text-h3 text-text-heading">Filters</h2>

          {/* Price Range */}
          <div className="space-y-3">
            <h3 className="font-label text-label text-text-body font-semibold">Price Range</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block font-label text-overline text-text-muted mb-1">Min</label>
                <input
                  className="w-full h-[42px] px-3 py-2 border border-border-default rounded bg-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50 font-body-default text-body-default placeholder:text-text-placeholder"
                  placeholder="$0"
                  type="text"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <label className="block font-label text-overline text-text-muted mb-1">Max</label>
                <input
                  className="w-full h-[42px] px-3 py-2 border border-border-default rounded bg-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50 font-body-default text-body-default placeholder:text-text-placeholder"
                  placeholder="$100"
                  type="text"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                />
              </div>
            </div>
          </div>

          <hr className="border-border-default" />

          {/* Amenities */}
          <div className="space-y-3">
            <h3 className="font-label text-label text-text-body font-semibold">Amenities</h3>
            <div className="space-y-2">
              {amenityOptions.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="w-4 h-4 rounded border-border-default text-primary focus:ring-primary-light"
                  />
                  <span className="font-body-default text-body-default text-text-body">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-border-default" />

          {/* Rating */}
          <div className="space-y-3">
            <h3 className="font-label text-label text-text-body font-semibold">Rating</h3>
            <div className="space-y-2">
              {ratingOptions.map((rating) => (
                <label key={rating} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.rating === rating}
                    onChange={() => setFilters({ ...filters, rating })}
                    className="w-4 h-4 border-border-default text-primary focus:ring-primary-light"
                  />
                  <span className="font-body-default text-body-default text-text-body flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    {rating}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Apply Filters Button */}
          <button
            onClick={handleApplyFilters}
            className="mt-auto bg-action text-on-primary font-label text-label px-4 py-2 rounded shadow-sm hover:bg-action-pressed transition-colors focus:outline-none focus:ring-2 focus:ring-action/50 active:scale-95"
          >
            Apply Filters
          </button>
        </aside>

        {/* ===== CENTER LIST ===== */}
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-y-auto bg-bg-page p-6 gap-6">
          {/* Results Header */}
          <div className="flex justify-between items-end mb-2">
            <div>
              <h1 className="font-h2 text-h2 text-text-heading">
                {hostels.length} Hostels Found
              </h1>
              <p className="font-body-default text-body-default text-text-muted">
                Showing results for "Amsterdam"
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-[42px] pl-3 pr-8 py-2 border border-border-default rounded bg-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50 font-label text-label text-text-body appearance-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating: High to Low</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Hostel Cards List */}
          <div className="flex flex-col gap-4 pb-8">
            {hostels.map((hostel) => (
              <article
                key={hostel.id}
                className="bg-bg-card rounded-xl border border-border-default flex flex-col sm:flex-row overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Image */}
                <div className="w-full sm:w-60 aspect-video sm:aspect-auto relative shrink-0">
                  <div className="w-full h-full bg-surface-dim" />
                  {hostel.verified && (
                    <div
                      className="absolute top-2 left-2 bg-success text-on-primary rounded-full p-1 flex items-center justify-center shadow-sm"
                      title="Verified"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-h3 text-h3 text-text-heading line-clamp-1">
                      {hostel.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-primary-deep font-label text-label flex-shrink-0 ml-2">
                      <Star className="w-3.5 h-3.5 fill-primary-deep" />
                      <span>{hostel.rating}</span>
                    </div>
                  </div>

                  <p className="font-body-default text-body-default text-text-muted mb-3 flex items-center gap-1 line-clamp-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    {hostel.location}
                  </p>

                  {/* Amenities Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hostel.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-surface-variant text-on-surface-variant font-overline text-overline px-2 py-1 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>

                  {/* Price & Action */}
                  <div className="mt-auto flex justify-between items-end border-t border-border-default pt-3">
                    <div>
                      <span className="font-label text-overline text-text-muted block">from</span>
                      <span className="font-h2 text-h2 text-primary-deep">
                        ${hostel.price}
                        <span className="font-body-default text-body-default text-text-muted font-normal">
                          /night
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={() => onViewDetails(hostel.id)}
                      className="bg-primary text-on-primary font-label text-label px-4 py-2 rounded shadow-sm hover:bg-primary-dark active:scale-95 transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ===== RIGHT MAP AREA (Desktop) ===== */}
        {mapViewEnabled && (
          <div className="w-1/2 h-[calc(100vh-64px)] hidden xl:flex relative bg-surface-dim border-l border-border-default shrink-0 flex-col">
            {/* Map Background */}
            <div className="flex-1 bg-gradient-to-br from-surface-dim to-surface-container relative overflow-hidden" />

            {/* Map Markers */}
            {hostels.map((hostel, idx) => {
              const positions = [
                { top: '40%', left: '30%' },
                { top: '55%', left: '60%' },
                { top: '30%', left: '70%' },
              ];
              const pos = positions[idx];
              const isActive = idx === 0;

              return (
                <div
                  key={hostel.id}
                  className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group"
                  style={{ top: pos.top, left: pos.left }}
                >
                  <div
                    className={`font-label text-label font-bold px-3 py-1 rounded shadow-md relative group-hover:scale-105 transition-transform ${
                      isActive
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-container text-primary-deep border border-primary-container'
                    }`}
                  >
                    ${hostel.price}
                  </div>
                </div>
              );
            })}

            {/* Map Controls */}
            <div className="absolute right-4 bottom-4 flex flex-col gap-2">
              <button className="w-10 h-10 bg-bg-card rounded shadow-sm border border-border-default flex items-center justify-center text-text-heading hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary-light/50">
                <Plus className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-bg-card rounded shadow-sm border border-border-default flex items-center justify-center text-text-heading hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary-light/50">
                <Minus className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-bg-card rounded shadow-sm border border-border-default flex items-center justify-center text-primary-deep hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary-light/50 mt-2">
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 border-t border-border-default shadow-lg bg-bg-card flex justify-around items-center h-16 px-4 pb-safe text-[11px] font-bold font-h2">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMobileNav(item.id);
              onNavigation(item.id);
            }}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-all duration-200 focus:outline-none ${
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
