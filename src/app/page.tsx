'use client';

import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/layout/top-nav';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { HeroSection } from './hero-section';
import { FeaturedHostels } from './featured-hostels';
import { HowItWorks } from './how-it-works';

export function HomePage() {
  const router = useRouter();

  const handleSearchClick = () => {
    router.push('/search');
  };

  return (
    <div className="bg-bg-page text-text-body font-body-default flex flex-col min-h-screen">
      <TopNav />

      <main className="flex-grow w-full max-w-[640px] mx-auto pb-24 md:pb-0">
        <HeroSection onSearchClick={handleSearchClick} />

        <FeaturedHostels />

        <HowItWorks />
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
}
