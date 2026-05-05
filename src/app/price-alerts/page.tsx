import { Metadata } from 'next';
import PriceAlertDrawerResponsive from '@/components/price-alerts/price-alert-drawer-responsive';

export const metadata: Metadata = {
  title: 'Price Alerts | HostelHub',
  description:
    'Manage your price alerts and set target prices for your favorite hostels. Get notified when prices drop.',
};

export default function PriceAlertDrawerPage() {
  return <PriceAlertDrawerResponsive />;
}
