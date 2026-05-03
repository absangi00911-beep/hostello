"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import styles from "./dashboard-nav.module.css";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "📊" },
  { label: "Listings", href: "/dashboard/listings", icon: "🏢" },
  { label: "Bookings", href: "/dashboard/bookings", icon: "📅" },
  { label: "Messages", href: "/dashboard/messages", icon: "💬" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "📈" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <nav className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>HostelLo</h2>
        <p className={styles.subtitle}>Owner Dashboard</p>
      </div>

      <ul className={styles.navList}>
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${styles.navLink} ${
                pathname === item.href ? styles.active : ""
              }`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        🚪 Logout
      </button>
    </nav>
  );
}
