'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Users, BookOpen, Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import styles from './admin-nav.module.css';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Hostels', href: '/admin/hostels', icon: Building2 },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Bookings', href: '/admin/bookings', icon: BookOpen },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Admin</h2>
        <p className={styles.subtitle}>Control Panel</p>
      </div>

      <ul className={styles.navList}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${active ? styles.active : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className={styles.footer}>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className={styles.logoutButton}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
