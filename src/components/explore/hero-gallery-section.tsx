'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MapPin, Users } from 'lucide-react';

interface HeroSearchBarProps {
  onSearch?: (city: string, gender: string) => void;
}

export function HeroSearchBar({ onSearch }: HeroSearchBarProps) {
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');

  const handleSearch = () => {
    onSearch?.(city, gender);
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border-default p-space-2 shadow-sm flex flex-col md:flex-row gap-space-2 max-w-3xl mt-space-4">
      {/* City Select */}
      <div className="flex-grow relative px-space-3 py-space-2 border-b md:border-b-0 md:border-r border-border-default flex items-center gap-space-2">
        <MapPin className="w-5 h-5 text-text-placeholder flex-shrink-0" />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-text-body font-body-default p-0 outline-none cursor-pointer appearance-none"
        >
          <option className="text-text-placeholder" value="">
            Select City
          </option>
          <option value="lahore">Lahore</option>
          <option value="karachi">Karachi</option>
          <option value="islamabad">Islamabad</option>
        </select>
      </div>

      {/* Gender Select */}
      <div className="flex-grow relative px-space-3 py-space-2 border-b md:border-b-0 md:border-r border-border-default flex items-center gap-space-2">
        <Users className="w-5 h-5 text-text-placeholder flex-shrink-0" />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-text-body font-body-default p-0 outline-none cursor-pointer appearance-none"
        >
          <option className="text-text-placeholder" value="">
            Gender
          </option>
          <option value="male">Boys</option>
          <option value="female">Girls</option>
          <option value="any">Any</option>
        </select>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="bg-action text-on-primary font-label text-label px-space-6 py-space-3 rounded shrink-0 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 active:scale-97"
      >
        Search
      </button>
    </div>
  );
}

interface HeroSectionWithGalleryProps {
  onSearch?: (city: string, gender: string) => void;
}

export function HeroSectionWithGallery({ onSearch }: HeroSectionWithGalleryProps) {
  const images = [
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZnuHvnmz3UTjiWCTURUT1IRs7Gsl37RCrTpuYWACAmHI05nBRtk8WZNptBdhU80LZhQxHQoa3wlevXWR6QcZOvRldwSmjSwrOqBR7Eujmz8QhbbEereB6aeFSWyMEpuCZPX93uj_XYvj-xbGFn3vF8O6eE1MOE64_hvP62l5p07iJWRQYtDYAyQuSsyRDrDSXdwecl9gCLWOJJlLIcZD1tRvkxrQ52i91K4d4px7agfj5QjiPEzIxFS8YHBrurAvrUTKj7bcz-TNz',
      alt: 'Student hostel room with beds',
      rotate: 'rotate-6',
      z: 'z-10',
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqHf6D_5MUtYuDzwiem7ZjMARzgPakEnVDWqB_UL6rP3N129G4BapDQn7mLWCoYGFKoY0ML2JAdW_8pS7s4TNS5Y22B-z-jBwbZ63DOEVGdH4n_-fiLehnhagTcavO9xNaTojwAvU-f5NVrLMxrNj7i7Go7kNJp7NYH8HtVEsM_n78aKT09pXTflq5Aq0Juijl11_wG-hWwG-WdRvcqMfBo110QcMSLOJjQudjO-2m6RdY7kLFrflRQcMjLvoB3R6ZSEjjaFoIotn',
      alt: 'Communal kitchen area',
      rotate: '-rotate-3',
      z: 'z-20',
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3Y5ZyFerXeC6YT4qGpxQPtKaNUtMK8dd4_FavrBp3beyBbuQd1b107IIgUAAToVastjYNGt04DU7WlmPdE4xRC3kOx20lvXiaqW2PC6zTRnRFhPcam3UgtWTDEpPZ5-PZyYTaRCB5Y542NY3spZXQutM065D3InR1-voSSnLG0gmtOm2lKFa3o5VSNYA5ubz2xh7TKbk5zQK-REv962VJwibWnbHCSo509q08GTHYcxs88mQZf8ZpWze6WHeqBszJNpMxvOrf26RO',
      alt: 'Study lounge area',
      rotate: 'rotate-2',
      z: 'z-30',
    },
  ];

  return (
    <section className="max-w-[1280px] mx-auto px-space-4 md:px-space-8 py-space-12 md:py-space-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-8 items-center">
        {/* Left Content (2/3) */}
        <div className="lg:col-span-8 flex flex-col gap-space-6">
          <h1 className="font-display text-display text-text-heading">
            Find your room.
            <br />
            Not a phone number.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Skip the unreliable listings. Discover verified, comfortable student hostels with transparent
            pricing and secure booking in seconds.
          </p>

          <HeroSearchBar onSearch={onSearch} />
        </div>

        {/* Right Image Gallery (1/3) */}
        <div className="lg:col-span-4 relative h-[400px] hidden lg:block">
          {images.map((image, idx) => (
            <div
              key={idx}
              className={`absolute w-64 h-80 ${image.rotate} ${image.z}`}
              style={{
                top: `${idx * 40}px`,
                right: `${idx * 64}px`,
              }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover rounded-lg border-4 border-bg-card shadow-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
