"use client";

import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RecentlyViewedProps {
  limit?: number;
  className?: string;
}

/**
 * Display recently viewed hostels with ability to remove items.
 * Shows 3-5 most recently viewed hostels.
 */
export function RecentlyViewed({ limit = 5, className }: RecentlyViewedProps) {
  const { items, isLoaded, removeHostel } = useRecentlyViewed();

  if (!isLoaded) {
    return null; // Don't render until hydrated
  }

  if (items.length === 0) {
    return null; // Don't show if no items
  }

  const displayItems = items.slice(0, limit);

  return (
    <div className={cn("py-8", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-[var(--color-brand-600)]" />
          <h2 className="text-2xl font-bold text-[var(--color-ink)]">
            Recently Viewed
          </h2>
          <span className="text-sm text-[var(--color-muted)] ml-2">
            ({displayItems.length})
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {displayItems.map((hostel, index) => (
              <motion.div
                key={hostel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/hostels/${hostel.slug}`}>
                  <div className="group relative h-full rounded-lg overflow-hidden border border-[var(--color-border)] hover:shadow-md transition-shadow bg-white cursor-pointer">
                    {/* Image */}
                    <div className="relative w-full h-40 bg-[var(--color-ground)]">
                      {hostel.coverImage ? (
                        <Image
                          src={hostel.coverImage}
                          alt={hostel.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">
                          No image
                        </div>
                      )}

                      {/* Badge: Verified */}
                      {hostel.verified && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                          ✓ Verified
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeHostel(hostel.id);
                        }}
                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove from recently viewed"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      {/* Name */}
                      <h3 className="font-semibold text-sm text-[var(--color-ink)] line-clamp-2 mb-1">
                        {hostel.name}
                      </h3>

                      {/* City */}
                      <p className="text-xs text-[var(--color-muted)] mb-2">
                        {hostel.city}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-medium text-[var(--color-ink)]">
                          {hostel.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">
                          ({hostel.reviewCount})
                        </span>
                      </div>

                      {/* Price */}
                      <p className="text-sm font-bold text-[var(--color-brand-600)]">
                        Rs {hostel.pricePerMonth.toLocaleString()}
                        <span className="text-xs font-normal text-[var(--color-muted)]">
                          /month
                        </span>
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
