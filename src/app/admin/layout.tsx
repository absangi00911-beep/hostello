// Path: src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { AdminLayout } from "@/components/layout/AdminLayout";

async function getPendingCounts() {
  try {
    const [hostels, verifications] = await Promise.all([
      db.hostel.count({ where: { status: "PENDING_REVIEW" } }),
      db.user.count({ where: { verificationStatus: "PENDING" } }),
    ]);
    return { hostels, verifications };
  } catch {
    return { hostels: 0, verifications: 0 };
  }
}

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session)                      redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const { hostels: hostelCount, verifications: verificationCount } = await getPendingCounts();

  return (
    <AdminLayout pendingCount={hostelCount} verificationCount={verificationCount}>
      {children}
    </AdminLayout>
  );
}
