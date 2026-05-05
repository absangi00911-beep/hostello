'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, CheckCircle } from 'lucide-react';

interface HostelCard {
  id: string;
  name: string;
  location: string;
  rating: number;
  price: number;
  image: string;
  verified?: boolean;
}

interface VerifiedHostelsGridProps {
  hostels?: HostelCard[];
  city?: string;
}

const DEFAULT_HOSTELS: HostelCard[] = [
  {
    id: '1',
    name: "The Scholar's Den Boys Hostel",
    location: 'Johar Town, Lahore',
    rating: 4.8,
    price: 18000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDWx6If88wxgMAxnpXAZeQsHDHBFkouzwmtaUZndxl4sWEA6xkLd7r6SHvVTGiczKLg0UlbCwlwfhI7xa3_1wQMGYMfS5fTpylKYCrdd13a3PeXnm-0weMhukVmGD_4i-yg3G_YqCHxAHEVDv49VkJuBc2J7sMZXj7T936JYzUDwwFrOn4bMMgHgWgAkvrWY2BQlqd0aAZCCxJGs82cbzVNppk3N8xL7TZXMVidZHbXad4djZlTNtAY2W-K3oHDDGJvVL6jFssge6Z8',
    verified: true,
  },
  {
    id: '2',
    name: 'Elite Girls Premium Living',
    location: 'Model Town, Lahore',
    rating: 4.9,
    price: 22000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDb7tuDlue-BYZrfibrb-Tvmdz0aAvIS2rH-VPAS-KPyjICxffSnmivPVWlO-fL4P8jthzswn1VNvwwgjA_GBtaO52Llr0SJvDPDh6w4zYUKbdWlJpGesOUZs9-fVpXwD7kgh6Dgazq6dbYpeYD8b9twVHuDk_W8T9ru-fIfAJqsQZb_KcHPli0DKbKFl7u-qgG1_KhlXu6IyxoYWX34WLMzbJ3jLzOkpzGhrwgbeOLHyxudo0aJmkeeZmGfJzJxFH7RbHLsvopGb9w',
    verified: true,
  },
  {
    id: '3',
    name: 'Campus View Residency',
    location: 'Wapda Town, Lahore',
    rating: 4.6,
    price: 16500,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6yt2So91Cg9d77P6qjMoJ2UIP6TnLl-b93UAqL3qJmHFYgoat01qOdGSQ_1TPppUMAl604Ub2cxExxDagQBSNTGhGacg-vvbagijJKPjjWlCg4MeX-UDQ9J05O9n4WMZCbCgzsWBPKxtQnDJv3zVcXtGfGYQ5L27fKRYgzwAPi9oXnm75lNXUNIAl6m-Q2RduKeOxkz51INgh-qv7XKbFB9nLhrwj7pkK1AzoAbtn5suRTDMABaQC6zWLJOubOAfjQPRzvoKiEP1S',
    verified: true,
  },
];

export function VerifiedHostelsGridResponsive({
  hostels = DEFAULT_HOSTELS,
  city = 'Lahore',
}: VerifiedHostelsGridProps) {
  return (
    <section className="bg-bg-raised py-space-16 border-t border-border-default">
      <div className="max-w-[1280px] mx-auto px-space-4 md:px-space-8">
        <h2 className="font-h2 text-h2 text-text-heading mb-space-8">
          Verified hostels in {city}
        </h2>

        {/* Grid: 1-col mobile, 2-col tablet, 3-col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-6">
          {hostels.map((hostel) => (
            <Link
              key={hostel.id}
              href={`/hostel/${hostel.id}`}
              className="bg-bg-card rounded-lg border border-border-default overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full group"
            >
              {/* Image Container */}
              <div className="relative w-full pt-[56.25%] bg-surface-variant overflow-hidden">
                <Image
                  src={hostel.image}
                  alt={hostel.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />

                {/* Verified Badge */}
                {hostel.verified && (
                  <div className="absolute top-space-2 left-space-2 bg-bg-card/90 backdrop-blur-sm rounded px-space-2 py-space-1 flex items-center gap-space-1 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-success" strokeWidth={2} />
                    <span className="font-overline text-overline text-success uppercase text-xs">
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-space-4 flex flex-col flex-grow">
                {/* Header */}
                <div className="flex justify-between items-start mb-space-1 gap-space-2">
                  <h3 className="font-h3 text-h3 text-text-heading line-clamp-1 group-hover:text-primary-deep transition-colors flex-grow">
                    {hostel.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-4 h-4 text-warning fill-warning" strokeWidth={1.5} />
                    <span className="font-label text-label text-text-heading">{hostel.rating}</span>
                  </div>
                </div>

                {/* Location */}
                <p className="font-body-default text-body-default text-text-muted mb-space-4 line-clamp-1">
                  {hostel.location}
                </p>

                {/* Footer - Price */}
                <div className="mt-auto">
                  <span className="font-h3 text-h3 text-primary-deep">
                    Rs {hostel.price.toLocaleString()}
                  </span>
                  <span className="font-body-default text-body-default text-text-muted">/mo</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-space-8 text-center">
          <Link
            href={`/search?city=${city.toLowerCase()}`}
            className="border border-border-strong text-text-heading font-label text-label px-space-6 py-space-3 rounded hover:bg-surface-variant transition-colors duration-200 inline-block"
          >
            View all in {city}
          </Link>
        </div>
      </div>
    </section>
  );
}
