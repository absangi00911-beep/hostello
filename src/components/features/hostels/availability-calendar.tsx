"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface AvailabilityMonth {
  month: string;
  occupancyRate: number;
  available: number;
}

interface AvailabilityCalendarProps {
  hostelSlug: string;
}

function OccupancyColor(rate: number): string {
  if (rate >= 90) return "bg-red-100 text-red-700 border-red-200";
  if (rate >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-green-100 text-green-700 border-green-200";
}

export function AvailabilityCalendar({ hostelSlug }: AvailabilityCalendarProps) {
  const [data, setData] = useState<AvailabilityMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/hostels/${hostelSlug}/availability`)
      .then((r) => r.json())
      .then((j) => setData(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hostelSlug]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-16 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <section>
      <h2
        className="text-xl font-bold text-[var(--color-text)] mb-5"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Availability
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {data.map((month) => (
          <div
            key={month.month}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-center",
              OccupancyColor(month.occupancyRate)
            )}
          >
            <p className="text-xs font-semibold">
              {format(parseISO(`${month.month}-01`), "MMM yyyy")}
            </p>
            <p className="text-lg font-bold mt-0.5" style={{ fontFamily: "var(--font-display)" }}>
              {month.available}
            </p>
            <p className="text-xs opacity-75">beds free</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Available</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />Filling up</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Almost full</span>
      </div>
    </section>
  );
}
