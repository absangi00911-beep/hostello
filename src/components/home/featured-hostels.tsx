'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface FeaturedHostel {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  type: string;
  availability: string;
  price: number;
  originalPrice?: number;
  verified: boolean;
}

interface FeaturedHostelsProps {
  hostels?: FeaturedHostel[];
}

const DEFAULT_HOSTELS: FeaturedHostel[] = [
  {
    id: '1',
    name: 'Greenwood Student Residence',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBO3ZH17tocibz9x_Znad7y-y5TRCArRQK6z_caF1tBSF8O4WaWxCE2l9P9mM-LoUAuyflOJnaEdrBkogMyWnXE8hwVxOzjR-bXAfcQ9MUNdxYdgs80ODVfi4-RiCvkaX4qXDJTXxwMqQTkeAg9mDhMbtIi7l990l87OsaFV2UYtrwmgeuihbZOJoW9twAUiCTiQC2zZzTLS1KjmO45uG998SQRi2dDXuGL2o9YeCXno1BbrgmF35x8GuHsu0_TSbcq3j6rZXd5deZN',
    location: 'Johar Town, Lahore',
    rating: 4.8,
    type: 'Boys',
    availability: '2 Seater Available',
    price: 22500,
    originalPrice: 25000,
    verified: true,
  },
  {
    id: '2',
    name: 'Elite Girls Enclave',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCiocU3m85ZeWtym54E3O3HV-Yr0th68wwbM1QdoBmND7eOq2hiL21nlomzPNrIbCYcP7uy48uRE2sj_KT7fyxIor8ElC9cW-4NCiEBX1KdxUs-a7Vij1n_p4Khf8PJLsoG3ATiC5peDRRPHICeStdzygDjIzdE0egLJSZX7bLBjNOPTLnR-Sht1CjwXJxFNd-SAkIoVWqZ8gOOAI6BLpZ6MKjDLmJzWVyrXjClI6NOmhls1rI47C8LnnHAMcVmXymoNGhII2PkYusK',
    location: 'Wapda Town, Lahore',
    rating: 4.9,
    type: 'Girls',
    availability: '3 Seater Available',
    price: 18000,
    verified: true,
  },
];

export function FeaturedHostels({ hostels = DEFAULT_HOSTELS }: FeaturedHostelsProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  return (
    <section className="px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-h2 text-h2 text-text-heading">Verified Hostels</h2>
        <Link
          href="/search"
          className="font-label text-label text-action font-semibold flex items-center gap-1 hover:underline transition-colors"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-6">
        {hostels.map((hostel) => (
          <article
            key={hostel.id}
            className="bg-bg-card rounded-xl border border-border-default shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 cursor-pointer"
          >
            {/* Image */}
            <div className="relative aspect-video w-full bg-surface-variant overflow-hidden">
              <Image
                src={hostel.image}
                alt={hostel.name}
                fill
                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
              />

              {/* Verified Badge */}
              {hostel.verified && (
                <div className="absolute top-3 left-3 bg-bg-card/90 backdrop-blur-sm border border-border-default text-text-heading px-2 py-1 rounded flex items-center gap-1">
                  <CheckCircle className="w-4.5 h-4.5 text-success" />
                  <span className="font-label text-label font-bold text-xs tracking-wide">VERIFIED</span>
                </div>
              )}

              {/* Favorite Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(hostel.id);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg-card/90 backdrop-blur-sm flex items-center justify-center text-text-muted hover:text-error transition-colors"
              >
                <Heart
                  className="w-5 h-5"
                  fill={favorites.has(hostel.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="font-h3 text-h3 text-text-heading mb-1 line-clamp-1">
                    {hostel.name}
                  </h3>
                  <div className="flex items-center gap-1 text-text-muted font-label text-label">
                    <MapPin className="w-4 h-4" />
                    <span>{hostel.location}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 bg-surface-variant px-2 py-1 rounded shrink-0">
                  <Star className="w-4 h-4 text-primary-deep fill-primary-deep" />
                  <span className="font-label text-label font-bold text-text-heading">
                    {hostel.rating}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border-default pt-3 mt-1 flex justify-between items-end">
                <div className="font-label text-label text-text-muted">
                  {hostel.type} • {hostel.availability}
                </div>
                <div className="text-right">
                  {hostel.originalPrice && (
                    <span className="font-label text-label text-text-muted line-through text-xs mr-1">
                      Rs {hostel.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <div className="font-h3 text-h3 text-primary-deep">
                    Rs {hostel.price.toLocaleString()}
                    <span className="font-body-default text-body-default text-text-muted text-sm font-normal">
                      /mo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
