'use client';

import React, { useState } from 'react';
import { Heart, Mail, Bell, Search, NotificationsActive, ChevronRight, MapPin, Star, Calendar, Phone, MessageSquare, RotateCcw, CheckCircle, Clock, History } from 'lucide-react';

interface Booking {
  id: string;
  hostelName: string;
  location: string;
  price: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'pending' | 'completed';
  image: string;
  roomType?: string;
  rating?: number;
}

interface StudentDashboardResponsiveProps {
  bookings?: Booking[];
  onViewDetails?: (bookingId: string) => void;
  onContactHost?: (bookingId: string) => void;
  onLeaveReview?: (bookingId: string) => void;
}

const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: '1',
    hostelName: 'Sunny Side Student Hostel',
    location: 'Berlin, Germany',
    price: 340,
    currency: '€',
    checkIn: '15 Oct 2023',
    checkOut: '15 Jan 2024',
    status: 'confirmed',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDA5Pk6caybG8-PIHCfecqfoRDUe6otrgH5kkGALQeV9qBCc39EWYvKRtFfwT9BynhZpaAT-OZUdVKeDrmsV0-DiGIvlIyKDmFNylyXzHB4TwmNKzEkNDbdm3BGYG2QSZsE0La_WDs9KM1BUMsIX5dwpgKv1kwIfMcnKpQsOOw_vlqNOBs14x87gi4tDnO5VNyjv3wJwcglGVguwyzTmP0_80ijZprR1k4wwEXkT22tpK_liWR0TqZ0YLbvf5NCRvi4RLltNx2D-RG',
    rating: 4.8,
  },
  {
    id: '2',
    hostelName: 'Urban Loft Downtown',
    location: 'Madrid, Spain',
    price: 450,
    currency: '€',
    checkIn: '01 Feb 2024',
    checkOut: '30 Jun 2024',
    status: 'pending',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_674cVr9IZCiw0JCr9KejpeosdBEQuga0V_U6grVGgDvAQYKzmfPRFJdVRknOIEcy46q1p_aiwJCJc37PQUZFSZcOcU8z8PCoSA9glGFgLQ51PW6QhcHPpZZqgQ_1Iw5py3VFZcdwuin1EPCxZvevm1MuVDWSmzyJv-MPAIBmxrEmFjZj8pPbdWqogK53hm4BAL2L8rRO-22oP7tmZVA-CEyOj2SITNDLx0MGUEzHhMMjB761JVsdmEK6BuO3AjtcGef6ZsBHto6g',
  },
  {
    id: '3',
    hostelName: 'Riverside Student Dorms',
    location: 'Prague, Czechia',
    price: 310,
    currency: '€',
    checkIn: '01 Sep 2022',
    checkOut: '30 Jan 2023',
    status: 'completed',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBclKtQgffPKWyeIsn6S1FGdJcUIn_8jzajIRPRU-kb3eKONVbSe644HxeHH-NmwlAjZ2yTvVWbYhgmtwM-vJqP8HJZ_MasdBIDJ6otecDhmbxrgAUd9P0ViCwQgmqq0ZpWNZ2AiuRuZ9Vpmmm3GR9dT-6jUjB1QGChxvQcTt4Sj4rfpb4mnJb3qOPdweealfTtk13Zn1p-Q1buErj92fbkS_EeBEJrhPL9ivdQ7-On53fDhEL41akzs8Cx_qLFWQxIOy1M1UeDT-rQ',
  },
];

const StatusBadge = ({ status }: { status: Booking['status'] }) => {
  if (status === 'confirmed') {
    return (
      <div className="flex items-center gap-1 bg-success text-on-primary px-2 py-1 rounded shadow-sm">
        <CheckCircle size={14} />
        <span className="font-overline text-overline tracking-wider">CONFIRMED</span>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-1 bg-warning text-on-primary-fixed-variant px-2 py-1 rounded shadow-sm">
        <Clock size={14} />
        <span className="font-overline text-overline tracking-wider">PENDING</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 bg-surface-variant text-text-muted border border-border-default px-2 py-1 rounded shadow-sm">
      <History size={14} />
      <span className="font-overline text-overline tracking-wider">COMPLETED</span>
    </div>
  );
};

const BookingCard = ({
  booking,
  onViewDetails,
  onContactHost,
  onLeaveReview,
}: {
  booking: Booking;
  onViewDetails?: (id: string) => void;
  onContactHost?: (id: string) => void;
  onLeaveReview?: (id: string) => void;
}) => {
  const isCompleted = booking.status === 'completed';
  
  return (
    <article
      className={`bg-bg-card rounded-xl border border-border-default shadow-sm hover:shadow-[0_4px_12px_rgba(194,139,26,0.08)] hover:-translate-y-[1px] transition-all duration-200 overflow-hidden flex flex-col sm:flex-row ${
        isCompleted ? 'opacity-80 hover:opacity-100' : ''
      }`}
    >
      {/* Image Container */}
      <div className={`relative w-full sm:w-48 h-40 sm:h-auto shrink-0 bg-surface-container-highest ${isCompleted ? 'grayscale-[20%]' : ''}`}>
        <img
          alt={booking.hostelName}
          src={booking.image}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2">
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Content Container */}
      <div className="p-space-4 sm:p-space-5 flex flex-col justify-between flex-grow">
        <div>
          {/* Title & Price */}
          <div className="flex justify-between items-start gap-4 mb-1">
            <h3 className="font-h3 text-h3 text-text-heading line-clamp-1">
              {booking.hostelName}
            </h3>
            <span className={`font-h3 text-[18px] font-bold whitespace-nowrap ${
              isCompleted ? 'text-text-muted' : 'text-primary-deep'
            }`}>
              {booking.currency}
              {booking.price}
            </span>
          </div>

          {/* Location */}
          <p className="font-body-default text-body-default text-text-muted mb-space-3 flex items-center gap-1">
            <MapPin size={16} className="text-border-strong" />
            {booking.location}
          </p>

          {/* Check-in/Check-out Info */}
          <div className={`grid grid-cols-2 gap-space-2 sm:gap-space-4 mb-space-4 p-space-3 rounded-lg border ${
            isCompleted
              ? 'bg-bg-page border-border-default/30'
              : 'bg-surface-container-low border-border-default/50'
          }`}>
            <div>
              <span className="block font-overline text-overline text-text-muted mb-0.5">
                CHECK IN
              </span>
              <span className={`font-label text-label font-medium ${
                isCompleted ? 'text-text-muted' : 'text-text-body'
              }`}>
                {booking.checkIn}
              </span>
            </div>
            <div>
              <span className="block font-overline text-overline text-text-muted mb-0.5">
                CHECK OUT
              </span>
              <span className={`font-label text-label font-medium ${
                isCompleted ? 'text-text-muted' : 'text-text-body'
              }`}>
                {booking.checkOut}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-space-3 mt-auto">
          {booking.status === 'confirmed' && (
            <>
              <button
                onClick={() => onViewDetails?.(booking.id)}
                className="bg-action text-on-primary font-label text-label px-space-4 py-2 rounded-md hover:bg-action-pressed active:scale-97 transition-all shadow-sm"
              >
                View Details
              </button>
              <button
                onClick={() => onContactHost?.(booking.id)}
                className="bg-transparent border border-border-strong text-text-heading font-label text-label px-space-4 py-2 rounded-md hover:bg-surface-container hover:border-outline transition-colors"
              >
                Contact Host
              </button>
            </>
          )}
          {booking.status === 'pending' && (
            <button className="bg-transparent border border-border-strong text-text-heading font-label text-label px-space-4 py-2 rounded-md hover:bg-surface-container hover:border-outline transition-colors">
              Cancel Request
            </button>
          )}
          {booking.status === 'completed' && (
            <>
              <button
                onClick={() => onLeaveReview?.(booking.id)}
                className="bg-transparent border border-primary-container text-primary-deep font-label text-label px-space-4 py-2 rounded-md hover:bg-primary-faint transition-colors flex items-center gap-2"
              >
                <Star size={18} />
                Leave Review
              </button>
              <button className="bg-transparent text-text-muted hover:text-text-heading font-label text-label px-space-3 py-2 rounded-md transition-colors underline underline-offset-2">
                View Receipt
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export const StudentDashboardResponsive = ({
  bookings = SAMPLE_BOOKINGS,
  onViewDetails,
  onContactHost,
  onLeaveReview,
}: StudentDashboardResponsiveProps) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('bookings');

  const filteredBookings =
    statusFilter === 'all'
      ? bookings
      : bookings.filter((b) => {
          if (statusFilter === 'upcoming') return b.status === 'confirmed' || b.status === 'pending';
          return b.status === statusFilter;
        });

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-bg-page border-b border-stone-200 shadow-sm">
        <div className="flex justify-between items-center w-full px-space-4 sm:px-space-6 lg:px-space-8 h-16 max-w-[1280px] mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-space-2 cursor-pointer group">
            <div className="text-primary-container text-2xl">🏢</div>
            <h1 className="text-primary-container font-h1 font-black text-xl tracking-tight">
              HostelLo
            </h1>
          </div>

          {/* Desktop Navigation (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-space-6">
            <a
              href="#"
              className="text-stone-600 hover:bg-stone-100 transition-colors px-3 py-2 rounded-md font-label text-label flex items-center gap-2"
            >
              <Search size={20} /> Search
            </a>
            <a
              href="#"
              className="text-primary-container bg-amber-50 px-3 py-2 rounded-md font-label text-label flex items-center gap-2 transition-colors"
            >
              <CheckCircle size={20} /> My Bookings
            </a>
            <a
              href="#"
              className="text-stone-600 hover:bg-stone-100 transition-colors px-3 py-2 rounded-md font-label text-label flex items-center gap-2"
            >
              <Heart size={20} /> Saved
            </a>
            <a
              href="#"
              className="text-stone-600 hover:bg-stone-100 transition-colors px-3 py-2 rounded-md font-label text-label flex items-center gap-2"
            >
              <Mail size={20} /> Inbox
            </a>
          </nav>

          {/* Trailing Actions */}
          <div className="flex items-center gap-space-4">
            <button className="text-primary-container hover:bg-stone-100 transition-colors p-2 rounded-full relative hover:scale-95 duration-75">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-bg-page"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-border-default cursor-pointer">
              <img
                alt="User Avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyK6fNinv_mJLNFytgNB00W3LsdKeyOHmRwy5Y21zoDgfo4L-eJV3GSnR1brSfYcEOz1QmQ4iUrm48ehMTm7G9v8h99wGNlsUSdTtHObFvRmjfhCgigOQiYXQyDS7KvNAsamByEY6WuzDUA73XoSIWbpJdzKY9oEF_3LHjW_N9-KNnmTczgOP6T3OgQCjOsIUmPI5MuvughHzTYRvaV_UrJKVxKL63eFmEODpRgtmWFidyqpoGKGPXNiRVbJ7nY7ERPXCY3jXSYzjp"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20 md:pb-16 min-h-screen bg-bg-page">
        <div className="max-w-[1024px] mx-auto px-space-4 sm:px-space-6 lg:px-space-8 py-space-8">
          {/* Page Header (Desktop) */}
          <div className="mb-space-8 hidden md:block">
            <h1 className="font-h1 text-h1 text-text-heading mb-space-2">Dashboard</h1>
            <p className="font-body-default text-body-default text-text-muted">
              Manage your hostel stays, messages, and account settings.
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-6 lg:gap-space-8">
            {/* Sidebar Navigation (Desktop Only) */}
            <aside className="hidden md:block md:col-span-3 lg:col-span-3">
              <nav className="sticky top-[88px] flex flex-col gap-space-1">
                <a
                  href="#"
                  className="flex items-center gap-space-3 px-space-3 py-2.5 rounded-lg bg-surface-container-highest text-text-heading font-label text-label border border-border-default shadow-[0_1px_2px_rgba(194,139,26,0.05)] transition-all"
                >
                  <CheckCircle size={20} className="text-primary-deep" />
                  My Bookings
                </a>
                <a
                  href="#"
                  className="flex items-center gap-space-3 px-space-3 py-2.5 rounded-lg text-text-muted hover:bg-surface-container-low hover:text-text-heading font-label text-label transition-colors"
                >
                  <Heart size={20} />
                  Saved Hostels
                </a>
                <a
                  href="#"
                  className="flex items-center gap-space-3 px-space-3 py-2.5 rounded-lg text-text-muted hover:bg-surface-container-low hover:text-text-heading font-label text-label transition-colors justify-between"
                >
                  <div className="flex items-center gap-space-3">
                    <Mail size={20} />
                    Messages
                  </div>
                  <span className="bg-primary-faint text-primary-deep px-1.5 py-0.5 rounded text-[10px] font-bold">
                    2
                  </span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-space-3 px-space-3 py-2.5 rounded-lg text-text-muted hover:bg-surface-container-low hover:text-text-heading font-label text-label transition-colors"
                >
                  <Bell size={20} />
                  Price Alerts
                </a>
                <hr className="my-space-2 border-border-default" />
                <a
                  href="#"
                  className="flex items-center gap-space-3 px-space-3 py-2.5 rounded-lg text-text-muted hover:bg-surface-container-low hover:text-text-heading font-label text-label transition-colors"
                >
                  <div size={20}>👤</div>
                  Profile & Settings
                </a>
              </nav>
            </aside>

            {/* Main Content Area */}
            <div className="col-span-1 md:col-span-9 lg:col-span-9">
              {/* Mobile Tab Navigation */}
              <nav className="md:hidden flex gap-space-4 overflow-x-auto scrollbar-hide pb-space-2 mb-space-6 border-b border-border-default">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`whitespace-nowrap px-space-4 py-space-2 rounded-full font-label text-label transition-colors ${
                    activeTab === 'bookings'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-text-muted hover:bg-surface-container'
                  }`}
                >
                  Bookings
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`whitespace-nowrap px-space-4 py-space-2 rounded-full font-label text-label transition-colors ${
                    activeTab === 'favorites'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-text-muted hover:bg-surface-container'
                  }`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`whitespace-nowrap px-space-4 py-space-2 rounded-full font-label text-label transition-colors ${
                    activeTab === 'alerts'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-text-muted hover:bg-surface-container'
                  }`}
                >
                  Alerts
                </button>
              </nav>

              {/* Page Title & Filter (Desktop) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-space-6 gap-space-4">
                <h2 className="font-h2 text-h2 text-text-heading">My Bookings</h2>
                <div className="w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-bg-card border border-border-default text-text-body font-label text-label rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-container focus:border-primary-container outline-none w-full sm:w-auto cursor-pointer shadow-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Booking Cards List */}
              <div className="flex flex-col gap-space-4">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onViewDetails={onViewDetails}
                    onContactHost={onContactHost}
                    onLeaveReview={onLeaveReview}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 border-t rounded-t-lg border-stone-200 bg-bg-card shadow-[0_-4px_6px_-1px_rgba(194,139,26,0.05)] pb-safe">
        <div className="flex justify-around items-center px-4 py-3">
          <a
            href="#"
            className="flex flex-col items-center justify-center text-stone-500 opacity-80 hover:opacity-100 font-h2 text-[11px] font-semibold transition-colors"
          >
            <Search size={24} className="mb-1" />
            Search
          </a>
          <a
            href="#"
            className="flex flex-col items-center justify-center text-stone-500 opacity-80 hover:opacity-100 font-h2 text-[11px] font-semibold transition-colors"
          >
            <Heart size={24} className="mb-1" />
            Saved
          </a>
          <a
            href="#"
            className="flex flex-col items-center justify-center text-stone-500 opacity-80 hover:opacity-100 font-h2 text-[11px] font-semibold transition-colors relative"
          >
            <Mail size={24} className="mb-1" />
            <span className="absolute top-0 right-2 w-2 h-2 bg-error rounded-full"></span>
            Inbox
          </a>
          <a
            href="#"
            className="flex flex-col items-center justify-center text-primary-container bg-amber-50 rounded-xl px-3 py-1 font-h2 text-[11px] font-semibold transition-transform hover:scale-95"
          >
            <div size={24} className="mb-1">👤</div>
            Profile
          </a>
        </div>
      </nav>
    </>
  );
};
