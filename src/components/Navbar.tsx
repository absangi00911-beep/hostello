'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, Bell, MessageSquare, User, LogOut, Settings, Home } from 'lucide-react'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it Works' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)

  const isActive = (href: string) => pathname === href

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
    setIsOpen(false)
    setIsDropdownOpen(false)
  }

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isOpen) {
          setIsOpen(false)
        }
        if (isDropdownOpen) {
          setIsDropdownOpen(false)
          userButtonRef.current?.focus()
        }
      }
    }

    if (isOpen || isDropdownOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isDropdownOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="HostelLo home">
          <span className={styles.logoIcon} aria-hidden="true">🏠</span>
          <span className={styles.logoText}>HostelLo</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav} role="menubar">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
              role="menuitem"
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className={styles.actions}>
          {status === 'loading' ? (
            <div className={styles.skeleton} />
          ) : session ? (
            <>
              {/* Desktop: Notifications & Messages */}
              <div className={styles.desktopIcons} role="group" aria-label="Notifications and messages">
                <button
                  className={styles.iconButton}
                  aria-label="Notifications (3 unread)"
                  title="Notifications"
                  type="button"
                >
                  <Bell size={20} aria-hidden="true" />
                  <span className={styles.badge} aria-label="3 notifications">3</span>
                </button>
                <Link
                  href="/messages"
                  className={styles.iconButton}
                  aria-label="Messages (2 unread)"
                  title="Messages"
                >
                  <MessageSquare size={20} aria-hidden="true" />
                  <span className={styles.badge} aria-label="2 messages">2</span>
                </Link>
              </div>

              {/* User Menu Dropdown */}
              <div className={styles.userMenu} ref={dropdownRef}>
                <button 
                  ref={userButtonRef}
                  className={styles.userButton} 
                  aria-label={`User menu for ${session.user?.name}`}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setIsDropdownOpen(!isDropdownOpen)
                    }
                  }}
                  type="button"
                >
                  <div className={styles.avatar} aria-hidden="true">{session.user?.name?.[0] || 'U'}</div>
                </button>
                {isDropdownOpen && (
                  <div className={styles.dropdown} role="menu">
                    <div className={styles.dropdownHeader} aria-label="Current user">
                      {session.user?.name}
                    </div>
                    <Link href="/profile" className={styles.dropdownItem} role="menuitem">
                      <User size={16} aria-hidden="true" /> Profile
                    </Link>
                    <Link href="/dashboard/bookings" className={styles.dropdownItem} role="menuitem">
                      <Home size={16} aria-hidden="true" /> My Bookings
                    </Link>
                    <Link href="/favorites" className={styles.dropdownItem} role="menuitem">
                      <span aria-hidden="true">❤️</span> Favorites
                    </Link>
                    <Link href="/messages" className={styles.dropdownItem} role="menuitem">
                      <MessageSquare size={16} aria-hidden="true" /> Messages
                    </Link>
                  {session.user?.role === 'OWNER' && (
                    <Link href="/dashboard/listings" className={styles.dropdownItem} role="menuitem">
                      <span aria-hidden="true">🏢</span> My Listings
                    </Link>
                  )}
                  {session.user?.role === 'ADMIN' && (
                    <Link href="/admin" className={styles.dropdownItem} role="menuitem">
                      <span aria-hidden="true">⚙️</span> Admin
                    </Link>
                  )}
                  <Link href="/profile/settings" className={styles.dropdownItem} role="menuitem">
                    <Settings size={16} aria-hidden="true" /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={styles.dropdownItemLogout}
                    role="menuitem"
                    type="button"
                  >
                    <LogOut size={16} aria-hidden="true" /> Logout
                  </button>
                </div>
              )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>
                Login
              </Link>
              <Link href="/signup" className={styles.signupBtn}>
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          type="button"
        >
          {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className={styles.mobileNav} role="navigation" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.active : ''}`}
              onClick={() => setIsOpen(false)}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}

          <div className={styles.mobileDivider} />

          {status === 'loading' ? (
            <div className={styles.skeleton} />
          ) : session ? (
            <>
              <div className={styles.mobileUserInfo}>
                <div className={styles.avatar} aria-hidden="true">{session.user?.name?.[0] || 'U'}</div>
                <div>
                  <p className={styles.mobileUserName}>{session.user?.name}</p>
                  <p className={styles.mobileUserEmail}>{session.user?.email}</p>
                </div>
              </div>
              <Link href="/profile" className={styles.mobileMenuAction}>
                <User size={18} aria-hidden="true" /> Profile
              </Link>
              <Link href="/dashboard/bookings" className={styles.mobileMenuAction}>
                <Home size={18} aria-hidden="true" /> My Bookings
              </Link>
              <Link href="/messages" className={styles.mobileMenuAction}>
                <MessageSquare size={18} aria-hidden="true" /> Messages
              </Link>
              {session.user?.role === 'OWNER' && (
                <Link href="/dashboard/listings" className={styles.mobileMenuAction}>
                  <span aria-hidden="true">🏢</span> My Listings
                </Link>
              )}
              {session.user?.role === 'ADMIN' && (
                <Link href="/admin" className={styles.mobileMenuAction}>
                  <span aria-hidden="true">⚙️</span> Admin
                </Link>
              )}
              <Link href="/profile/settings" className={styles.mobileMenuAction}>
                <Settings size={18} aria-hidden="true" /> Settings
              </Link>
              <button
                onClick={handleLogout}
                className={styles.mobileMenuActionLogout}
                type="button"
              >
                <LogOut size={18} aria-hidden="true" /> Logout
              </button>
            </>
          ) : (
            <div className={styles.mobileAuthButtons}>
              <Link href="/login" className={styles.mobileLoginBtn}>
                Login
              </Link>
              <Link href="/signup" className={styles.mobileSignupBtn}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
