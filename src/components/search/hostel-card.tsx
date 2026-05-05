'use client';

import Image from 'next/image';
import { Star, MapPin, CheckCircle } from 'lucide-react';

interface AmenityChip {
  icon: string;
  label: string;
  color: string;
}

interface HostelCardProps {
  id: string;
  name: string;
  image: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  location: string;
  amenities: AmenityChip[];
  price: number;
  onCardClick?: () => void;
}

export function HostelCard({
  id,
  name,
  image,
  verified,
  rating,
  reviewCount,
  location,
  amenities,
  price,
  onCardClick,
}: HostelCardProps) {
  return (
    <article
      onClick={onCardClick}
      className="bg-bg-card rounded-xl border border-border-default overflow-hidden hover:-translate-y-[2px] hover:shadow-md hover:shadow-primary-container/10 transition-all duration-200 flex flex-col cursor-pointer group"
    >
      {/* Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-variant">
        <Image
          src={image}
          alt={name}
          fill
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Verified Badge */}
        {verified && (
          <div className="absolute top-space-3 left-space-3 bg-bg-card/95 backdrop-blur-sm px-space-2 py-space-1 rounded-full flex items-center gap-space-1 shadow-sm border border-border-default/50">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="font-label text-[11px] font-bold tracking-wide text-text-heading uppercase">
              Verified
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-space-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start gap-space-2 mb-space-1">
          <h3 className="font-h1 text-[1.25rem] text-text-heading leading-tight group-hover:text-action-dark transition-colors line-clamp-1">
            {name}
          </h3>

          {/* Rating Badge */}
          <div className="flex items-center gap-1 shrink-0 bg-surface-container rounded px-1.5 py-0.5 border border-border-default/50">
            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
            <span className="font-label text-label text-text-heading font-bold">{rating}</span>
            <span className="font-body-default text-[11px] text-text-muted">({reviewCount})</span>
          </div>
        </div>

        {/* Location */}
        <p className="font-body-default text-[0.875rem] text-text-muted mb-space-3 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {location}
        </p>

        {/* Amenity Chips */}
        <div className="flex flex-wrap gap-space-2 mb-space-4">
          {amenities.map((amenity, idx) => (
            <span
              key={idx}
              className={`px-space-2 py-1 bg-surface-bright text-text-body font-label text-[11px] rounded border border-border-default flex items-center gap-1`}
            >
              <span className={`text-[14px]`} style={{ color: amenity.color }}>
                {amenity.icon}
              </span>
              {amenity.label}
            </span>
          ))}
        </div>

        {/* Footer - Price */}
        <div className="pt-space-3 border-t border-border-default flex justify-between items-end mt-auto">
          <div className="flex flex-col">
            <span className="font-overline text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
              Starting from
            </span>
            <div>
              <span className="font-h3 text-[1.25rem] text-primary-deep font-bold">
                Rs {price.toLocaleString()}
              </span>
              <span className="font-body-default text-[12px] text-text-muted">/mo</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
