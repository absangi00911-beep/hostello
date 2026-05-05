import Link from 'next/link';
import { HeroSectionResponsive } from '@/components/landing/hero-section-responsive';
import { VerifiedHostelsGridResponsive } from '@/components/landing/verified-hostels-grid-responsive';
import { HowItWorksResponsive } from '@/components/landing/how-it-works-responsive';

export function LandingPage() {
  return (
    <main className="flex-grow">
      <HeroSectionResponsive />
      <VerifiedHostelsGridResponsive />
      <HowItWorksResponsive />
    </main>
  );
}
