'use client'

import { useState } from 'react'
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
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  const isActive = (href: string) => pathname === href

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
    setIsOpen(false)
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🏠</span>
          <span className={styles.logoText}>HostelLo</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
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
              <div className={styles.desktopIcons}>
                <button
                  className={styles.iconButton}
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell size={20} />
                  <span className={styles.badge}>3</span>
                </button>
                <Link
                  href="/messages"
                  className={styles.iconButton}
                  aria-label="Messages"
                  title="Messages"
                >
                  <MessageSquare size={20} />
                  <span className={styles.badge}>2</span>
                </Link>
              </div>

              {/* User Menu Dropdown */}
              <div className={styles.userMenu}>
                <button className={styles.userButton} aria-label="User menu">
                  <div className={styles.avatar}>{session.user?.name?.[0] || 'U'}</div>
                </button>
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    {session.user?.name}
                  </div>
                  <Link href="/profile" className={styles.dropdownItem}>
                    <User size={16} /> Profile
                  </Link>
                  <Link href="/dashboard/bookings" className={styles.dropdownItem}>
                    <Home size={16} /> My Bookings
                  </Link>
                  <Link href="/favorites" className={styles.dropdownItem}>
                    ❤️ Favorites
                  </Link>
                  <Link href="/messages" className={styles.dropdownItem}>
                    <MessageSquare size={16} /> Messages
                  </Link>
                  {session.user?.role === 'OWNER' && (
                    <Link href="/dashboard/listings" className={styles.dropdownItem}>
                      🏢 My Listings
                    </Link>
                  )}
                  {session.user?.role === 'ADMIN' && (
                    <Link href="/admin" className={styles.dropdownItem}>
                      ⚙️ Admin
                    </Link>
                  )}
                  <Link href="/profile/settings" className={styles.dropdownItem}>
                    <Settings size={16} /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={styles.dropdownItemLogout}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
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
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className={styles.mobileNav}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.active : ''}`}
              onClick={() => setIsOpen(false)}
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
                <div className={styles.avatar}>{session.user?.name?.[0] || 'U'}</div>
                <div>
                  <p className={styles.mobileUserName}>{session.user?.name}</p>
                  <p className={styles.mobileUserEmail}>{session.user?.email}</p>
                </div>
              </div>
              <Link href="/profile" className={styles.mobileMenuAction}>
                <User size={18} /> Profile
              </Link>
              <Link href="/dashboard/bookings" className={styles.mobileMenuAction}>
                <Home size={18} /> My Bookings
              </Link>
              <Link href="/messages" className={styles.mobileMenuAction}>
                <MessageSquare size={18} /> Messages
              </Link>
              <button
                onClick={handleLogout}
                className={styles.mobileMenuActionLogout}
              >
                <LogOut size={18} /> Logout
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
