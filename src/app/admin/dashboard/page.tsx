import { Metadata } from 'next';
import AdminDashboardOverviewResponsive from '@/components/admin/admin-dashboard-overview-responsive';

export const metadata: Metadata = {
  title: 'Admin Dashboard | HostelHub',
  description:
    'Admin dashboard overview with key metrics, recent activity, and marketplace management tools.',
};

export default function AdminDashboardPage() {
  return <AdminDashboardOverviewResponsive />;
}
