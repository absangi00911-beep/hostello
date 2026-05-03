"use client";

import { Booking } from "@prisma/client";
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

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Hostel</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedBookings.map((booking) => (
            <tr key={booking.id}>
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
                PKR {(booking.total / 100).toLocaleString()}
              </td>
              <td>
                <span className={`${styles.status} ${styles[booking.status.toLowerCase()]}`}>
                  {booking.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
