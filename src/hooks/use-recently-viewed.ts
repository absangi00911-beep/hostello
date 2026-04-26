"use client";

import { useEffect, useState, useCallback } from "react";

export interface RecentlyViewedHostel {
  id: string;
  name: string;
  slug: string;
  city: string;
  pricePerMonth: number;
  coverImage?: string | null;
  rating: number;
  reviewCount: number;
  verified: boolean;
  viewedAt: number; // timestamp
}

const STORAGE_KEY = "hostello-recently-viewed";
const MAX_ITEMS = 5;

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedHostel[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedHostel[];
        // Sort by most recent first
        parsed.sort((a, b) => b.viewedAt - a.viewedAt);
        setItems(parsed);
      }
    } catch (err) {
      console.error("[useRecentlyViewed] Failed to load from localStorage:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const addHostel = useCallback((hostel: Omit<RecentlyViewedHostel, "viewedAt">) => {
    setItems((prev) => {
      // Remove if already exists (we'll re-add it at the top)
      const filtered = prev.filter((item) => item.id !== hostel.id);

      // Create new entry with current timestamp
      const newEntry: RecentlyViewedHostel = {
        ...hostel,
        viewedAt: Date.now(),
      };

      // Add to front and trim to MAX_ITEMS
      const updated = [newEntry, ...filtered].slice(0, MAX_ITEMS);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("[useRecentlyViewed] Failed to save to localStorage:", err);
      }

      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("[useRecentlyViewed] Failed to clear localStorage:", err);
    }
  }, []);

  const removeHostel = useCallback((hostelId: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== hostelId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("[useRecentlyViewed] Failed to save to localStorage:", err);
      }
      return updated;
    });
  }, []);

  return {
    items,
    isLoaded,
    addHostel,
    clearAll,
    removeHostel,
  };
}
