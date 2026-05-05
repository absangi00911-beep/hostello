import { Metadata } from 'next';
import AdminUserManagementResponsive from '@/components/admin/admin-user-management-responsive';

export const metadata: Metadata = {
  title: 'User Management | HostelHub Admin',
  description:
    'Manage all registered students and hostel owners across the HostelHub platform with search, filters, and administrative controls.',
};

export default function AdminUsersPage() {
  return <AdminUserManagementResponsive />;
}
