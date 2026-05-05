'use client';

import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/layout/top-nav';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { HeroSectionWithGallery } from './hero-gallery-section';
import { VerifiedHostelsGrid } from './verified-hostels-grid';
import { HowItWorksLarge } from './how-it-works-large';

export function ExplorePage() {
  const router = useRouter();

  const handleSearch = (city: string, gender: string) => {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (gender) params.append('gender', gender);
    router.push(`/search?${params.toString()}`);
  };

  const handleViewAll = () => {
    router.push('/search?city=lahore');
  };

  return (
    <div className="bg-bg-page text-on-surface font-body-default min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-grow">
        <HeroSectionWithGallery onSearch={handleSearch} />

        <VerifiedHostelsGrid city="Lahore" onViewAll={handleViewAll} />

        <HowItWorksLarge />
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
}
