import { Metadata } from 'next';
import NotificationsPageResponsive from '@/components/notifications/notifications-page-responsive';

export const metadata: Metadata = {
  title: 'Notifications | HostelLo',
  description: 'View your booking confirmations, price alerts, messages, and system notifications.',
};

export default function NotificationsPage() {
  return <NotificationsPageResponsive />;
}
