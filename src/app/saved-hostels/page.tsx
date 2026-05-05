import { Metadata } from 'next';
import SavedHostelsResponsive from '@/components/saved/saved-hostels-responsive';

export const metadata: Metadata = {
  title: 'Saved Hostels | HostelHub',
  description: 'View your saved hostels and bookmarks. Save hostels for later from any listing page.',
};

export default function SavedHostelsPage() {
  return <SavedHostelsResponsive />;
}
