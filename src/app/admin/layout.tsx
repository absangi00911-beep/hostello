// Path: src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { AdminLayout } from "@/components/layout/AdminLayout";

async function getPendingCount(): Promise<number> {
  try {
    return await db.hostel.count({ where: { status: "PENDING_REVIEW" } });
  } catch {
    return 0;
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

  const pendingCount = await getPendingCount();

  return (
    <AdminLayout pendingCount={pendingCount}>
      {children}
    </AdminLayout>
  );
}