import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="border-b p-4 flex justify-between items-center bg-white">
      <Link href="/" className="font-bold text-xl text-[#2A6545]">Hostello</Link>
      <div className="flex gap-4">
        <Link href="/dashboard" className="text-sm font-medium">Dashboard</Link>
        <Link href="/dashboard/settings" className="text-sm font-medium">Settings</Link>
        <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-sm font-medium text-destructive">Sign Out</button>
        </form>
      </div>
    </nav>
  );
}
