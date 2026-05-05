'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  MapPin,
  Star,
  Heart,
  ChevronDown,
  Plus,
  Minus,
  CheckCircle,
} from 'lucide-react';

interface Hostel {
  id: number;
  name: string;
  location: string;
  distance: string;
  amenities: string[];
  rating: number;
  reviewCount: number;
  price: number;
  verified: boolean;
  image: string;
  saved: boolean;
}

interface SearchResultsResponsive {
  onSearchSubmit?: (query: string) => void;
  onHostelClick?: (hostelId: number) => void;
  onSaveToggle?: (hostelId: number) => void;
  onProfileClick?: () => void;
}

export default function SearchResultsResponsive({
  onSearchSubmit = () => {},
  onHostelClick = () => {},
  onSaveToggle = () => {},
  onProfileClick = () => {},
}: SearchResultsResponsive) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Barcelona, Spain');
  const [priceMin, setPriceMin] = useState('20');
  const [priceMax, setPriceMax] = useState('80');
  const [roomType, setRoomType] = useState('mixed-dorms');
  const [amenities, setAmenities] = useState(['free-wifi', 'kitchen-access']);
  const [sortBy, setSortBy] = useState('recommended');
  const [activeMapMarker, setActiveMapMarker] = useState(2);
  const [savedHostels, setSavedHostels] = useState<number[]>([2]);

  const hostels: Hostel[] = [
    {
      id: 1,
      name: 'Sant Jordi Hostels Rock Palace',
      location: 'Eixample, Barcelona',
      distance: '1.2km from center',
      amenities: ['Free Wi-Fi', 'Pool'],
      rating: 4.8,
      reviewCount: 214,
      price: 45,
      verified: true,
      image: 'https://via.placeholder.com/160x160',
      saved: false,
    },
    {
      id: 2,
      name: 'Generator Barcelona',
      location: 'Gràcia, Barcelona',
      distance: '2.5km from center',
      amenities: ['Bar', 'Events'],
      rating: 4.5,
      reviewCount: 482,
      price: 38,
      verified: false,
      image: 'https://via.placeholder.com/160x160',
      saved: false,
    },
    {
      id: 3,
      name: 'TOC Hostel Barcelona',
      location: 'Eixample, Barcelona',
      distance: '0.8km from center',
      amenities: ['Pool', 'Breakfast'],
      rating: 4.9,
      reviewCount: 89,
      price: 52,
      verified: true,
      image: 'https://via.placeholder.com/160x160',
      saved: true,
    },
  ];

  const amenityOptions = [
    { id: 'free-wifi', label: 'Free Wi-Fi' },
    { id: 'ac', label: 'Air Conditioning' },
    { id: 'kitchen-access', label: 'Kitchen Access' },
    { id: '24-reception', label: '24/7 Reception' },
  ];

  const handleAmenityToggle = (amenityId: string) => {
    setAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleSaveToggle = (hostelId: number) => {
    setSavedHostels((prev) =>
      prev.includes(hostelId) ? prev.filter((id) => id !== hostelId) : [...prev, hostelId]
    );
    onSaveToggle(hostelId);
  };

  const mapMarkers = [
    { id: 1, price: 45, top: '40%', left: '30%', active: false },
    { id: 2, price: 38, top: '60%', left: '50%', active: false },
    { id: 3, price: 52, top: '35%', left: '55%', active: true },
    { id: 4, price: 29, top: '50%', left: '70%', active: false },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden font-body-default bg-bg-page text-text-body">
      {/* ===== TOP APP BAR ===== */}
      <header className="sticky top-0 z-40 w-full border-b border-border-default shadow-sm bg-bg-card/90 backdrop-blur-md">
        <div className="flex justify-between items-center px-8 h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <span className="font-h2 text-h2 text-text-heading tracking-tighter">
              HostelHub Admin
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl px-8">
            <div className="relative w-full flex items-center bg-bg-raised rounded-full border border-border-default hover:border-border-strong focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-light/50 transition-all duration-200 shadow-sm h-12">
              <Search className="w-5 h-5 ml-4 text-text-muted" />
              <input
                className="w-full bg-transparent border-none focus:ring-0 text-text-body font-body-default px-3 h-full rounded-r-full outline-none placeholder:text-text-placeholder"
                placeholder="Search cities, neighborhoods, or specific hostels..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => onSearchSubmit(searchQuery)}
                className="bg-primary-container hover:bg-primary-dark text-on-primary font-label text-label px-6 h-full rounded-full transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-container/50"
              >
                Search
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="text-text-muted hover:text-text-heading transition-colors w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container/50">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={onProfileClick}
              className="h-8 w-8 rounded-full bg-surface-variant overflow-hidden border border-border-default cursor-pointer hover:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/50"
            />
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex overflow-hidden">
        {/* ===== SIDEBAR FILTERS (Mobile Hidden) ===== */}
        <aside className="w-70 flex-shrink-0 border-r border-border-default bg-bg-card overflow-y-auto hidden md:block">
          <div className="p-6 flex flex-col gap-6">
            {/* Filter Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <h2 className="font-h3 text-h3 text-text-heading">Filters</h2>
              <button className="text-primary-container hover:text-primary-dark font-label text-label underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container/50">
                Clear all
              </button>
            </div>

            {/* City */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-label text-text-heading">City</label>
              <div className="relative">
                <select
                  className="w-full h-[42px] appearance-none bg-surface border border-border-default rounded px-3 py-2 text-text-body font-body-default focus:border-primary-container focus:ring-2 focus:ring-primary-light/50 outline-none transition-colors"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option>Barcelona, Spain</option>
                  <option>Madrid, Spain</option>
                  <option>Seville, Spain</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
              </div>
            </div>

            {/* Price Range */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border-default">
              <label className="font-label text-label text-text-heading">Price Range (Per Night)</label>
              <div className="px-2">
                {/* Simulated Range Slider */}
                <div className="relative h-1 bg-surface-variant rounded-full mt-4">
                  <div className="absolute h-full bg-primary-container rounded-full left-[20%] right-[40%]"></div>
                  <div className="absolute w-4 h-4 bg-bg-card border-2 border-primary-container rounded-full -top-1.5 left-[20%] shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
                  <div className="absolute w-4 h-4 bg-bg-card border-2 border-primary-container rounded-full -top-1.5 right-[40%] shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
                </div>
              </div>

              {/* Price Inputs */}
              <div className="flex justify-between items-center mt-2">
                <div className="bg-surface border border-border-default rounded px-2 py-1 flex items-center gap-1">
                  <span className="text-text-muted text-sm">$</span>
                  <input
                    className="w-10 bg-transparent border-none p-0 text-center text-sm font-medium focus:ring-0 outline-none text-text-body"
                    type="text"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                </div>
                <span className="text-text-muted">-</span>
                <div className="bg-surface border border-border-default rounded px-2 py-1 flex items-center gap-1">
                  <span className="text-text-muted text-sm">$</span>
                  <input
                    className="w-10 bg-transparent border-none p-0 text-center text-sm font-medium focus:ring-0 outline-none text-text-body"
                    type="text"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Room Type */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border-default">
              <label className="font-label text-label text-text-heading">Room Type</label>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'mixed-dorms', label: 'Mixed Dorms' },
                  { value: 'female-only', label: 'Female Only' },
                  { value: 'private', label: 'Private Rooms' },
                ].map((room) => (
                  <label key={room.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="room-type"
                      value={room.value}
                      checked={roomType === room.value}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-4 h-4 text-primary-container border-border-strong focus:ring-primary-light/50 bg-surface"
                    />
                    <span className="font-body-default text-body-default text-text-body group-hover:text-text-heading transition-colors">
                      {room.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border-default">
              <label className="font-label text-label text-text-heading">Amenities</label>
              <div className="flex flex-col gap-2">
                {amenityOptions.map((amenity) => (
                  <label key={amenity.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={amenities.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      className="w-4 h-4 text-primary-container border-border-strong rounded-sm focus:ring-primary-light/50 bg-surface"
                    />
                    <span className="font-body-default text-body-default text-text-body group-hover:text-text-heading transition-colors">
                      {amenity.label}
                    </span>
                  </label>
                ))}
                <button className="text-left text-primary-container hover:text-primary-dark font-label text-label underline transition-colors mt-1 focus:outline-none focus:ring-2 focus:ring-primary-container/50">
                  Show 8 more
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ===== CENTER RESULTS LIST ===== */}
        <div className="flex-1 max-w-[600px] flex flex-col bg-bg-page overflow-y-auto border-r border-border-default">
          <div className="p-6 flex flex-col gap-6">
            {/* Results Header */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="font-h2 text-h2 text-text-heading mb-1">{selectedCity.split(',')[0]}</h1>
                <p className="font-body-default text-body-default text-text-muted">
                  {hostels.length} Hostels Found
                </p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="font-label text-label text-text-muted">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-[36px] bg-bg-card border border-border-default rounded px-2 py-1 text-sm text-text-heading font-medium focus:border-primary-container outline-none focus:ring-2 focus:ring-primary-container/50"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="rating">Rating (High to Low)</option>
                </select>
              </div>
            </div>

            {/* Hostel Cards */}
            <div className="flex flex-col gap-4">
              {hostels.map((hostel, idx) => (
                <div
                  key={hostel.id}
                  onClick={() => onHostelClick(hostel.id)}
                  className={`group bg-bg-card border rounded-lg overflow-hidden flex shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer h-40 ${
                    idx === 2 ? 'border-l-4 border-l-primary-container' : 'border-border-default'
                  }`}
                >
                  {/* Image */}
                  <div className="w-40 h-full relative flex-shrink-0 bg-surface-variant">
                    <div className="w-full h-full bg-gradient-to-br from-surface-dim to-surface-container" />
                    {hostel.verified && (
                      <div className="absolute top-2 left-2 bg-bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-success" />
                        <span className="text-[10px] font-bold text-text-heading uppercase tracking-wider">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      {/* Title + Heart */}
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-h3 text-[18px] text-text-heading truncate pr-2">
                          {hostel.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveToggle(hostel.id);
                          }}
                          className="text-text-muted hover:text-error transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-error/50 rounded"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              savedHostels.includes(hostel.id)
                                ? 'fill-error text-error'
                                : 'text-text-muted'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1 text-text-muted mb-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-body-default text-[13px] truncate">
                          {hostel.location} • {hostel.distance}
                        </span>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {hostel.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="bg-surface border border-border-default px-2 py-0.5 rounded text-[11px] font-medium text-text-body"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom: Rating + Price */}
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-primary-fixed-dim fill-primary-fixed-dim" />
                        <span className="font-label text-[14px] text-text-heading font-bold">
                          {hostel.rating}
                        </span>
                        <span className="text-[12px] text-text-muted">({hostel.reviewCount})</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-text-muted uppercase tracking-wider mb-0.5">
                          From
                        </p>
                        <p className="font-h3 text-[20px] text-primary-deep font-bold">
                          ${hostel.price}
                          <span className="font-body-default text-[13px] text-text-muted font-normal">
                            /night
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== RIGHT MAP VIEW (Desktop Only) ===== */}
        <div className="flex-1 hidden lg:block relative bg-surface-dim overflow-hidden">
          {/* Map Background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80)',
              filter: 'grayscale(30%) sepia(20%) hue-rotate(5deg) contrast(110%)',
            }}
          />

          {/* Map Controls (Top Right) */}
          <div className="absolute right-4 top-4 flex flex-col gap-2 z-20">
            <button className="w-10 h-10 bg-bg-card border border-border-default rounded shadow-sm flex items-center justify-center text-text-heading hover:bg-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container/50">
              <Plus className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-bg-card border border-border-default rounded shadow-sm flex items-center justify-center text-text-heading hover:bg-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container/50">
              <Minus className="w-5 h-5" />
            </button>
          </div>

          {/* Map Markers */}
          {mapMarkers.map((marker) => (
            <div
              key={marker.id}
              className="absolute -translate-x-1/2 -translate-y-full cursor-pointer group z-10"
              style={{ top: marker.top, left: marker.left }}
              onMouseEnter={() => setActiveMapMarker(marker.id)}
            >
              {marker.active ? (
                <>
                  <div className="bg-primary-container border-2 border-primary-dark text-on-primary font-bold px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(194,139,26,0.3)] text-sm whitespace-nowrap scale-110 transition-all">
                    ${marker.price}
                  </div>
                  <div className="w-4 h-4 bg-primary-container absolute -bottom-1.5 left-1/2 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-primary-dark"></div>
                </>
              ) : (
                <>
                  <div className="bg-bg-card border-2 border-primary-container text-text-heading font-bold px-3 py-1.5 rounded-full shadow-md text-sm whitespace-nowrap group-hover:scale-105 group-hover:bg-primary-container group-hover:text-on-primary transition-all">
                    ${marker.price}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
