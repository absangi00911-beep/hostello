'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Share2, MapPin, Star, CheckCircle, Clock } from 'lucide-react';
import { HeroGallery } from '@/components/hostel/hero-gallery';
import { RoomsTable } from '@/components/hostel/rooms-table';
import { BookingPanel } from '@/components/hostel/booking-panel';
import { TopNav } from '@/components/layout/top-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';

interface HostelDetailPageProps {
  params: {
    slug: string;
  };
}

export default function HostelDetailPage({ params }: HostelDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'rooms' | 'details' | 'reviews' | 'location'>('rooms');
  const [selectedRoomType, setSelectedRoomType] = useState('Double Shared');

  return (
    <div className="flex flex-col min-h-screen bg-bg-page text-text-body font-body-default">
      <TopNav />

      <main className="flex-grow">
        {/* Hero Image Gallery */}
        <HeroGallery />

        {/* Detail Layout Container */}
        <div className="max-w-[1280px] mx-auto px-space-4 md:px-space-8 py-space-8 md:py-space-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-8">
            {/* 8-column main content */}
            <div className="lg:col-span-8 flex flex-col gap-space-8">
              {/* Header Section */}
              <div className="flex flex-col gap-space-3 border-b border-border-default pb-space-6">
                <div className="flex flex-wrap items-center gap-space-3">
                  <span className="inline-flex items-center gap-1 bg-surface-container text-action font-label text-label px-2 py-1 rounded-full">
                    <MapPin className="w-[14px] h-[14px]" />
                    Lahore, PK
                  </span>
                  <span className="inline-flex items-center gap-1 bg-primary-faint text-primary-deep font-label text-label px-2 py-1 rounded-full border border-primary-light">
                    <CheckCircle className="w-[14px] h-[14px]" />
                    Verified Property
                  </span>
                  <div className="flex items-center gap-1 ml-auto text-primary-deep font-label text-label">
                    <Star className="w-[14px] h-[14px] fill-warning text-warning" />
                    <span className="font-bold">4.8</span>
                    <span className="text-text-muted">(124 reviews)</span>
                  </div>
                </div>
                <h1 className="font-h2 text-h2 text-text-heading">Greenwood Heights Boys Hostel</h1>
                <p className="font-body-lg text-body-lg text-text-muted">
                  Premium accommodation for university students featuring modern amenities, high-speed internet, and 24/7 security.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border-default overflow-x-auto">
                {(['rooms', 'details', 'reviews', 'location'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-space-4 py-space-3 font-label text-label whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? 'text-action border-b-2 border-action'
                        : 'text-text-muted hover:text-text-heading'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'rooms' && (
                <div className="flex flex-col gap-space-6">
                  <h2 className="font-h3 text-h3 text-text-heading">Available Rooms</h2>
                  <RoomsTable />
                </div>
              )}
            </div>

            {/* 4-column sticky booking panel */}
            <BookingPanel selectedRoomType={selectedRoomType} onRoomTypeChange={setSelectedRoomType} />
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
