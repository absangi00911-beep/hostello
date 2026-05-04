"use client";

import { Booking } from "@prisma/client";
import Link from "next/link";
import styles from "./booking-table.module.css";
import { useState } from "react";

interface BookingTableProps {
  bookings: (Booking & {
    user: { name: string; email: string; phone: string | null };
    hostel: { name: string };
  })[];
}

export default function BookingTable({ bookings }: BookingTableProps) {
  const [sortBy, setSortBy] = useState<"date" | "status">("date");

  const sortedBookings = [...bookings].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.status.localeCompare(b.status);
  });

  return (
    <div className={styles.tableContainer}>
      <div className={styles.controls}>
        <div className={styles.sortControl}>
          <label htmlFor="sort">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "status")}
          >
            <option value="date">Date</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper} role="region" aria-label="Bookings table">
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Guest</th>
              <th scope="col">Hostel</th>
              <th scope="col">Check-in</th>
              <th scope="col">Check-out</th>
              <th scope="col">Amount</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className={styles.srOnly}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBookings.map((booking) => (
              <tr key={booking.id} className={styles.tableRow}>
                <td>
                  <div className={styles.guestInfo}>
                    <p className={styles.name}>{booking.user.name}</p>
                    <p className={styles.email}>{booking.user.email}</p>
                  </div>
                </td>
                <td>{booking.hostel.name}</td>
                <td>{new Date(booking.checkIn).toLocaleDateString()}</td>
                <td>{new Date(booking.checkOut).toLocaleDateString()}</td>
                <td className={styles.amount}>
                  PKR {booking.total.toLocaleString()}
                </td>
                <td>
                  <span className={`${styles.status} ${styles[booking.status.toLowerCase()]}`}>
                    {booking.status}
                  </span>
                </td>
                <td className={styles.actionCell}>
                  <Link 
                    href={`/dashboard/bookings/${booking.id}`}
                    className={styles.viewLink}
                    aria-label={`View booking details for ${booking.user.name}`}
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
