import { ProfileForm } from '@/components/dashboard/settings/profile-form';
import { PasswordForm } from '@/components/dashboard/settings/password-form';

export default function SettingsPage() {
  // In a real app, fetch user data here or from session
  const user = { name: 'John Doe', phone: '03001234567' };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Account Settings</h1>
      <div className="grid gap-6">
        <ProfileForm user={user} />
        <PasswordForm />
      </div>
    </div>
  );
}
