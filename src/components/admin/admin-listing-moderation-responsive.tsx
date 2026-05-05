'use client';

import { useState } from 'react';
import {
  Dashboard,
  House,
  Calendar,
  RateReview,
  Settings,
  HelpOutline,
  Logout,
  Search,
  Filter,
  Notifications,
  AccountCircle,
  ChevronLeft,
  ChevronRight,
  Image,
} from 'lucide-react';

interface ListingRow {
  id: string;
  hostelName: string;
  ownerEmail: string;
  city: string;
  submittedDate: string;
  image?: string;
  status: 'pending' | 'active' | 'suspended';
}

interface AdminListingModerationResponsiveProps {
  listings?: ListingRow[];
  pendingCount?: number;
  onApprove?: (id: string) => void;
  onSuspend?: (id: string) => void;
  onSearch?: (query: string) => void;
  currentTab?: 'pending' | 'active' | 'suspended';
  onTabChange?: (tab: 'pending' | 'active' | 'suspended') => void;
}

const DEFAULT_LISTINGS: ListingRow[] = [
  {
    id: '1',
    hostelName: 'The Wandering Backpack',
    ownerEmail: 'owner@wanderingbackpack.com',
    city: 'Lisbon',
    submittedDate: 'Oct 24, 2023',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7xf-Ulsz3MzJ5oUkavAgOkc1ZuWmutoyVE4WiHIPDXcz4BT_yLtDVZnG76zivfl-InXv1bSxF0hS6m89cdZ8Lcul6K_8pFQukqwPQJp4vdRIfZ5ikh3nORmruyY_Efoo9PX6S6tAvlj6tKnPjUSUvsmzhjgJRbQ7zeo-v90CtRCklD7iFUaOYaz4s2r_087j9tSVG9pYN2w8JHXHkPz996BdZ5D4fOf_-osJ3vcSUUz54PFXiROOoJ44tjETs0ki38BFcYeRT-rGz',
    status: 'pending',
  },
  {
    id: '2',
    hostelName: 'Urban Oasis Stay',
    ownerEmail: 'hello@urbanoasis.net',
    city: 'Barcelona',
    submittedDate: 'Oct 23, 2023',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC96vvultAfiOn1BJPA63gXZZP9iLcHSCGY5SkbAoMfoGPkZVFWfykAg1Vvv-OJOuqsYx91uYSNgWsULNIct4_4XoEY5GlTlNgb25RsoQFBDLKn9EaL6BX2apAsyQw-ZSHnVZTWr20zC4gVa7q4FAhqh-5sdYauyJDMMmph4GMl-NXPoCo-7_Lfc_8wFzRT_pnMUk_Ql7Kx5i-_J4j_sBrtH-bhXT2VQ0585YA8UaLb3HPO21KUIWB42qKDfCL8iNDZuFns2jOfp_Qh',
    status: 'pending',
  },
  {
    id: '3',
    hostelName: 'Alpine View Lodge',
    ownerEmail: 'contact@alpineview.ch',
    city: 'Interlaken',
    submittedDate: 'Oct 21, 2023',
    status: 'pending',
  },
  {
    id: '4',
    hostelName: 'City Central Hub',
    ownerEmail: 'admin@citycentralhub.com',
    city: 'Prague',
    submittedDate: 'Oct 20, 2023',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBflmsP8PyrGf3CIg0Sad26HrnzZXResxghn_8uWvFNECmM8e5SAZW_K3JokHh-58fmyq45KANjn-ESzzN4mm3GSMH-QKrk8vVhejnOx1aWCxbeJK994dYqzpitZ9YJziI5AJAkwrEcUl-agNULlagi2YGqZnnJWWh1KiankUHju7UBmvyNdQM6mp7bK5C_-4emUDOU5TNxnudVGwBm6_zbY0VW8fE1YPueCKrmiKPqFsndWsPi7Bf_cVhBGbuTEGT9ADpSPRoUdm7P',
    status: 'pending',
  },
];

export function AdminListingModerationResponsive({
  listings = DEFAULT_LISTINGS,
  pendingCount = 12,
  onApprove,
  onSuspend,
  onSearch,
  currentTab = 'pending',
  onTabChange,
}: AdminListingModerationResponsiveProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended'>(currentTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleTabChange = (tab: 'pending' | 'active' | 'suspended') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="bg-bg-page text-text-body font-body-default min-h-screen antialiased flex">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[240px] border-r border-stone-200 bg-bg-page shadow-[4px_0_24px_-12px_rgba(194,139,26,0.15)] flex-col py-space-6 z-50">
        {/* Header */}
        <div className="px-space-6 mb-space-8 flex items-center gap-space-3">
          <House className="w-8 h-8 text-primary-container" />
          <div>
            <h1 className="text-lg font-black text-stone-900 tracking-tight text-primary-container">HostelHub Admin</h1>
            <p className="font-overline text-overline text-text-muted">Marketplace Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-space-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Dashboard },
            { id: 'listings', label: 'Listings', icon: House },
            { id: 'bookings', label: 'All Bookings', icon: Calendar },
            { id: 'reviews', label: 'Reviews', icon: RateReview },
            { id: 'settings', label: 'System Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href="#"
              className={`flex items-center gap-space-3 px-space-4 py-space-3 rounded-DEFAULT transition-all duration-200 scale-[0.98] active:scale-95 ${
                id === 'listings'
                  ? 'bg-bg-raised text-primary-container font-semibold border-r-4 border-primary-container'
                  : 'text-stone-600 hover:bg-bg-raised'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </a>
          ))}
        </nav>

        {/* Footer Links */}
        <div className="mt-auto px-space-2 pt-space-4 border-t border-stone-200">
          {[
            { id: 'support', label: 'Support', icon: HelpOutline },
            { id: 'logout', label: 'Logout', icon: Logout },
          ].map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href="#"
              className="flex items-center gap-space-3 px-space-4 py-space-3 text-stone-600 hover:bg-bg-raised rounded-DEFAULT transition-all duration-200 scale-[0.98] active:scale-95"
            >
              <Icon className="w-5 h-5" />
              {label}
            </a>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[240px] flex flex-col min-h-screen pb-20 md:pb-0">
        {/* TopAppBar */}
        <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md shadow-sm flex justify-between items-center px-space-8 h-16">
          <div className="flex items-center gap-space-4">
            <span className="text-xl font-bold text-stone-900 hidden md:block">Management Console</span>
          </div>
          <div className="flex items-center gap-space-4">
            {/* Search Bar - Hidden on Mobile */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-space-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search listings..."
                className="pl-space-9 pr-space-4 py-space-2 bg-bg-overlay border-none rounded-full text-label font-label text-text-body placeholder:text-text-placeholder focus:ring-2 focus:ring-amber-500/50 outline-none w-64"
              />
            </div>
            <button className="p-space-2 text-stone-500 hover:text-stone-900 focus:ring-2 focus:ring-amber-500/50 outline-none rounded-full transition-colors">
              <Notifications className="w-5 h-5" />
            </button>
            <button className="p-space-2 text-stone-500 hover:text-stone-900 focus:ring-2 focus:ring-amber-500/50 outline-none rounded-full transition-colors">
              <AccountCircle className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-space-4 md:p-space-8 space-y-space-6 max-w-[1280px] mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-space-4 border-b border-border-default pb-space-4">
            <div>
              <h2 className="font-h2 text-h2 text-text-heading mb-space-1">Listing Moderation</h2>
              <p className="font-body-default text-body-default text-text-muted">Review and manage hostel submissions.</p>
            </div>

            {/* Search & Filter - Mobile/Inline */}
            <div className="flex items-center gap-space-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-space-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by name or city"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-space-10 pr-space-4 h-[42px] bg-bg-card border border-border-default rounded-DEFAULT text-label font-label text-text-body placeholder:text-text-placeholder focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-all"
                />
              </div>
              <button className="h-[42px] px-space-4 flex items-center justify-center gap-space-2 border border-border-default bg-bg-card text-text-body rounded-DEFAULT hover:bg-bg-raised transition-colors focus:ring-2 focus:ring-primary-container/50 outline-none whitespace-nowrap">
                <Filter className="w-5 h-5" />
                <span className="font-label text-label hidden sm:inline">Filter</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-space-6 border-b border-border-default font-label text-label">
            {[
              { id: 'pending', label: 'Pending Review', badge: pendingCount },
              { id: 'active', label: 'Active', badge: null },
              { id: 'suspended', label: 'Suspended', badge: null },
            ].map(({ id, label, badge }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id as 'pending' | 'active' | 'suspended')}
                className={`pb-space-3 border-b-2 transition-colors flex items-center gap-space-2 ${
                  activeTab === id
                    ? 'border-primary-container text-primary-container font-semibold'
                    : 'border-transparent text-text-muted hover:text-text-body'
                }`}
              >
                {label}
                {badge && (
                  <span className="bg-primary-container text-on-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table Card */}
          <div className="bg-bg-card rounded-lg border border-border-default shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-bg-raised border-b border-border-default text-text-muted font-overline text-overline uppercase">
                    <th className="py-space-3 px-space-6 font-semibold sticky left-0 bg-bg-raised z-10 w-[250px]">
                      Hostel Name
                    </th>
                    <th className="py-space-3 px-space-6 font-semibold">Owner Email</th>
                    <th className="py-space-3 px-space-6 font-semibold">City</th>
                    <th className="py-space-3 px-space-6 font-semibold">Submitted Date</th>
                    <th className="py-space-3 px-space-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-body-default text-body-default text-text-body divide-y divide-border-default">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-bg-raised/50 transition-colors h-[52px]">
                      <td className="py-space-2 px-space-6 sticky left-0 bg-bg-card hover:bg-bg-raised/50 z-10 w-[250px] font-medium text-text-heading flex items-center gap-space-3">
                        {listing.image ? (
                          <img
                            src={listing.image}
                            alt={listing.hostelName}
                            className="w-10 h-10 rounded-DEFAULT bg-surface-dim object-cover border border-border-default"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-DEFAULT bg-surface-dim flex items-center justify-center border border-border-default text-text-placeholder">
                            <Image className="w-5 h-5" />
                          </div>
                        )}
                        <span className="truncate">{listing.hostelName}</span>
                      </td>
                      <td className="py-space-2 px-space-6 text-text-muted truncate max-w-[200px]">
                        {listing.ownerEmail}
                      </td>
                      <td className="py-space-2 px-space-6">{listing.city}</td>
                      <td className="py-space-2 px-space-6 text-text-muted">{listing.submittedDate}</td>
                      <td className="py-space-2 px-space-6 text-right">
                        <div className="flex items-center justify-end gap-space-2">
                          <button
                            onClick={() => onSuspend?.(listing.id)}
                            className="px-space-3 py-1.5 font-label text-label text-error hover:bg-error-container/30 rounded-DEFAULT transition-colors outline-none focus:ring-2 focus:ring-error/50"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => onApprove?.(listing.id)}
                            className="px-space-3 py-1.5 font-label text-label text-action hover:bg-action-light/50 rounded-DEFAULT transition-colors outline-none focus:ring-2 focus:ring-action/50 font-semibold"
                          >
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-space-6 py-space-4 border-t border-border-default flex items-center justify-between bg-bg-card">
              <span className="font-label text-label text-text-muted">Showing 1 to 4 of 12 entries</span>
              <div className="flex items-center gap-space-2">
                <button
                  disabled
                  className="p-1 rounded-DEFAULT hover:bg-bg-raised text-text-muted hover:text-text-body disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="p-1 rounded-DEFAULT hover:bg-bg-raised text-text-muted hover:text-text-body transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 border-t border-stone-200 bg-white shadow-[0_-4px_12px_rgba(194,139,26,0.08)] flex justify-around items-center h-16 px-space-4 pb-safe text-[#C28B1A] text-[11px] font-bold">
        {[
          { id: 'dash', label: 'Dash', icon: Dashboard },
          { id: 'listings', label: 'Listings', icon: House },
          { id: 'bookings', label: 'Bookings', icon: Calendar },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href="#"
            className={`flex flex-col items-center justify-center px-space-3 py-1 rounded-xl transition-all active:scale-90 ${
              id === 'listings'
                ? 'text-primary-container bg-amber-50'
                : 'text-stone-400 active:bg-stone-100'
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
