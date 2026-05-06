'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Home,
  Calendar,
  Star,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Download,
  Plus,
  Edit,
  Ban,
  RotateCcw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  UserCircle,
} from 'lucide-react';
import { PrimaryButton, SecondaryButton, IconButton, TextInput } from '@/components/ui';
import { useDebounce } from '@/lib/performance-utils';

interface AdminUserManagementProps {
  onExport?: () => void;
  onAddUser?: () => void;
  onEditUser?: (userId: string) => void;
  onSuspendUser?: (userId: string) => void;
  onLogout?: () => void;
  onNavigation?: (path: string) => void;
}

interface User {
  id: string;
  name: string;
  initials: string;
  role: 'Student' | 'Owner' | 'Admin';
  email: string;
  joinDate: string;
  status: 'Active' | 'Suspended' | 'Pending';
}

export default function AdminUserManagementResponsive({
  onExport = () => {},
  onAddUser = () => {},
  onEditUser = () => {},
  onSuspendUser = () => {},
  onLogout = () => {},
  onNavigation = () => {},
}: AdminUserManagementProps) {
  const [activeNav, setActiveNav] = useState('settings');
  const [activeMobileNav, setActiveMobileNav] = useState('settings');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Debounce search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const users: User[] = [
    {
      id: '1',
      name: 'Alex Rodriguez',
      initials: 'AR',
      role: 'Student',
      email: 'alex.r@university.edu',
      joinDate: 'Oct 12, 2023',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Sarah Mitchell',
      initials: 'SM',
      role: 'Owner',
      email: 'contact@sunnyhostel.com',
      joinDate: 'Sep 04, 2023',
      status: 'Active',
    },
    {
      id: '3',
      name: 'James Doe',
      initials: 'JD',
      role: 'Student',
      email: 'j.doe99@mail.com',
      joinDate: 'Nov 21, 2023',
      status: 'Suspended',
    },
    {
      id: '4',
      name: 'Karen Lee',
      initials: 'KL',
      role: 'Owner',
      email: 'karen@citycenterstays.co',
      joinDate: 'Jan 05, 2024',
      status: 'Pending',
    },
  ];

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter;
      const matchesStatus =
        statusFilter === 'all' || user.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [debouncedSearchTerm, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'listings', label: 'Listings', icon: <Home className="w-5 h-5" /> },
    { id: 'bookings', label: 'All Bookings', icon: <Calendar className="w-5 h-5" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="w-5 h-5" /> },
    { id: 'settings', label: 'System Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const footerItems = [
    { id: 'support', label: 'Support', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'logout', label: 'Logout', icon: <LogOut className="w-5 h-5" /> },
  ];

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'Student':
        return 'bg-secondary-container text-on-secondary-container border border-secondary/20';
      case 'Owner':
        return 'bg-primary-faint text-primary-deep border border-primary-container/30';
      case 'Admin':
        return 'bg-tertiary-fixed text-on-tertiary-container border border-tertiary/20';
      default:
        return 'bg-surface-container text-text-body';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-success';
      case 'Suspended':
        return 'text-error';
      case 'Pending':
        return 'text-warning';
      default:
        return 'text-text-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-success';
      case 'Suspended':
        return 'bg-error';
      case 'Pending':
        return 'bg-warning';
      default:
        return 'bg-text-muted';
    }
  };

  return (
    <div className="bg-bg-page text-text-body font-body-default min-h-screen antialiased flex">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <nav className="fixed left-0 top-0 h-screen w-[240px] border-r border-border-default bg-bg-page shadow-[4px_0_24px_-12px_rgba(194,139,26,0.15)] hidden md:flex flex-col z-50">
        {/* Branding */}
        <div className="px-6 py-6 mb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-faint flex items-center justify-center text-primary-deep font-bold text-lg border border-border-default">
            HH
          </div>
          <div>
            <div className="text-lg font-black text-text-heading tracking-tighter">
              HostelHub Admin
            </div>
            <div className="text-xs text-text-muted">Marketplace Manager</div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                onNavigation(item.id);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-1 transition-all duration-200 scale-[0.98] active:scale-95 ${
                activeNav === item.id
                  ? 'bg-bg-raised text-primary-container font-semibold border-r-4 border-primary-container'
                  : 'text-text-muted hover:bg-bg-raised'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col gap-1 px-3 py-4 border-t border-border-default">
          {footerItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'logout') {
                  onLogout();
                } else {
                  onNavigation(item.id);
                }
              }}
              className="flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-bg-raised rounded-lg mx-1 transition-all duration-200 scale-[0.98] active:scale-95"
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 md:ml-[240px] flex flex-col min-w-0 bg-bg-page pb-20 md:pb-0">
        {/* TOP APP BAR */}
        <header className="sticky top-0 z-40 w-full border-b border-border-default bg-[#FEFCF8]/80 backdrop-blur-md shadow-sm flex justify-between items-center px-4 md:px-8 h-16 font-h2 font-medium">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-heading">Management Console</h2>
          </div>
          <div className="flex items-center gap-6">
            {/* Search Bar (Desktop) */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder" />
              <input
                type="text"
                placeholder="Search system..."
                className="pl-9 pr-4 py-2 bg-surface-container-low border border-border-default rounded-full text-sm text-text-body placeholder-text-placeholder focus:border-primary-container focus:ring-2 focus:ring-amber-500/50 outline-none w-64 transition-all focus:bg-surface-container-lowest"
              />
            </div>
            {/* Icons */}
            <div className="flex items-center gap-4 text-text-muted">
              <button className="hover:text-text-heading focus:ring-2 focus:ring-primary-light/50 outline-none rounded-full p-1 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="hover:text-text-heading focus:ring-2 focus:ring-primary-light/50 outline-none rounded-full p-1 transition-colors">
                <UserCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-space-8 lg:p-space-12 max-w-[1280px] mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-space-8">
            <div>
              <h1 className="font-h1 text-h1 text-text-heading mb-1">User Management</h1>
              <p className="font-body-default text-body-default text-text-muted">
                Manage all registered students and hostel owners across the platform.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SecondaryButton
                onClick={onExport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </SecondaryButton>
              <PrimaryButton
                onClick={onAddUser}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add User
              </PrimaryButton>
            </div>
          </div>

          {/* Controls Banner */}
          <div className="bg-bg-card border border-border-default rounded-xl p-4 mb-space-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 h-[42px] bg-bg-page border border-border-default rounded-lg text-sm text-text-body placeholder-text-placeholder focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all shadow-sm"
              />
            </div>
            {/* Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-sm font-medium text-text-muted whitespace-nowrap">Filter by:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[42px] pl-3 pr-8 bg-bg-page border border-border-default rounded-lg text-sm text-text-body focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none shadow-sm appearance-none"
                style={{
                  backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23857060%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px 16px',
                  paddingRight: '40px',
                }}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="owner">Owners</option>
                <option value="admin">Admins</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[42px] pl-3 pr-8 bg-bg-page border border-border-default rounded-lg text-sm text-text-body focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none shadow-sm appearance-none"
                style={{
                  backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23857060%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px 16px',
                  paddingRight: '40px',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Data Table Card */}
          <div className="bg-bg-card border border-border-default rounded-xl shadow-sm overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border-default">
                    <th className="px-6 py-4 font-label text-label text-text-muted whitespace-nowrap">
                      User
                    </th>
                    <th className="px-6 py-4 font-label text-label text-text-muted whitespace-nowrap">
                      Role
                    </th>
                    <th className="px-6 py-4 font-label text-label text-text-muted whitespace-nowrap">
                      Email Address
                    </th>
                    <th className="px-6 py-4 font-label text-label text-text-muted whitespace-nowrap">
                      Join Date
                    </th>
                    <th className="px-6 py-4 font-label text-label text-text-muted whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-6 py-4 font-label text-label text-text-muted whitespace-nowrap text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-raised transition-colors group">
                      {/* User */}
                      <td className="px-6 py-3 h-[52px]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-faint text-primary-deep flex items-center justify-center font-bold text-xs border border-border-default shrink-0">
                            {user.initials}
                          </div>
                          <div className="font-medium text-text-heading whitespace-nowrap">
                            {user.name}
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-6 py-3 h-[52px]">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${getRoleBadgeStyles(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      {/* Email */}
                      <td className="px-6 py-3 h-[52px] text-sm text-text-muted">{user.email}</td>
                      {/* Join Date */}
                      <td className="px-6 py-3 h-[52px] text-sm text-text-muted whitespace-nowrap">
                        {user.joinDate}
                      </td>
                      {/* Status */}
                      <td className="px-6 py-3 h-[52px]">
                        <div className={`flex items-center gap-1.5 text-sm font-medium ${getStatusStyles(user.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(user.status)}`} />
                          {user.status}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-3 h-[52px] text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {user.status === 'Suspended' ? (
                            <button
                              onClick={() => onEditUser(user.id)}
                              title="Restore"
                              className="p-1.5 text-text-muted hover:text-success hover:bg-success/10 rounded transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : user.status === 'Pending' ? (
                            <button
                              onClick={() => onEditUser(user.id)}
                              title="Approve"
                              className="p-1.5 text-text-muted hover:text-success hover:bg-success/10 rounded transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : null}
                          <button
                            onClick={() => onEditUser(user.id)}
                            title="Edit"
                            className="p-1.5 text-text-muted hover:text-info hover:bg-info/10 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.status !== 'Suspended' && (
                            <button
                              onClick={() => onSuspendUser(user.id)}
                              title="Suspend"
                              className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-border-default bg-surface-container-low flex items-center justify-between">
              <span className="text-sm text-text-muted font-medium">
                Showing {paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}{' '}
                entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded text-text-muted hover:bg-border-default/50 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded text-sm font-medium flex items-center justify-center transition-colors ${
                      currentPage === page
                        ? 'bg-primary-container text-on-primary'
                        : 'hover:bg-border-default/50 text-text-body'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && <span className="text-text-muted px-1">...</span>}
                {totalPages > 5 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded hover:bg-border-default/50 text-text-body font-medium text-sm flex items-center justify-center transition-colors"
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded text-text-muted hover:bg-border-default/50 transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="fixed bottom-0 w-full z-50 md:hidden border-t border-border-default bg-bg-card shadow-[0_-4px_12px_rgba(194,139,26,0.08)] flex justify-around items-center h-16 px-4 pb-safe">
        {[
          { id: 'dashboard', label: 'Dash', icon: <LayoutDashboard className="w-6 h-6" /> },
          { id: 'listings', label: 'Listings', icon: <Home className="w-6 h-6" /> },
          { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-6 h-6" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-6 h-6" /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMobileNav(item.id);
              onNavigation(item.id);
            }}
            className={`flex flex-col items-center justify-center px-3 py-1 tap-highlight-transparent active:scale-90 transition-transform rounded-xl text-[11px] font-bold ${
              activeMobileNav === item.id
                ? 'text-primary-container bg-primary-faint'
                : 'text-text-muted'
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
