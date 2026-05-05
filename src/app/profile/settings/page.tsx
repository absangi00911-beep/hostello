import { Metadata } from 'next';
import ProfileSettingsResponsive from '@/components/profile/profile-settings-responsive';

export const metadata: Metadata = {
  title: 'Profile & Settings | HostelHub',
  description: 'Manage your profile, account details, security settings, and notification preferences.',
};

export default function ProfileSettingsPage() {
  return <ProfileSettingsResponsive />;
}
