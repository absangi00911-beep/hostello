"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Bell } from "lucide-react";

interface PriceAlert {
  id: string;
  targetPrice: number;
  active: boolean;
  createdAt: string;
  hostel: {
    id: string;
    name: string;
    slug: string;
    pricePerMonth: number;
    city: string;
    coverImage: string | null;
  };
}

export function PriceAlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/price-alerts");
      if (!res.ok) throw new Error("Failed to load price alerts");
      const { data } = await res.json();
      setAlerts(data);
    } catch (err) {
      toast.error("Failed to load price alerts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/price-alerts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete alert");
      setAlerts(alerts.filter((a) => a.id !== id));
      toast.success("Price alert deleted");
    } catch (err) {
      toast.error("Failed to delete alert");
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-500)]" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="w-12 h-12 mx-auto text-[var(--color-muted)] mb-4" />
        <p className="text-[var(--color-muted)] mb-2">No price alerts yet</p>
        <p className="text-sm text-[var(--color-muted)]">
          Visit a hostel page and create an alert to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const priceDropped = alert.hostel.pricePerMonth < alert.targetPrice;
        return (
          <div
            key={alert.id}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <a
                  href={`/hostels/${alert.hostel.slug}`}
                  className="block font-bold text-[var(--color-ink)] hover:text-[var(--color-brand-500)] transition-colors mb-2"
                >
                  {alert.hostel.name}
                </a>
                <p className="text-sm text-[var(--color-muted)] mb-3">
                  {alert.hostel.city}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[var(--color-muted)] mb-1">Current price</p>
                    <p className="font-bold text-[var(--color-ink)]">
                      PKR {alert.hostel.pricePerMonth.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-muted)] mb-1">Target price</p>
                    <p className="font-bold text-[var(--color-ink)]">
                      PKR {alert.targetPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-muted)] mb-1">Status</p>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        priceDropped
                          ? "bg-green-100 text-green-700"
                          : alert.active
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {priceDropped ? "✓ Target Met" : alert.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-muted)]">
                  Created {new Date(alert.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => handleDelete(alert.id)}
                className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors flex-shrink-0"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
