// Path: src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { AdminLayout } from "@/components/layout/AdminLayout";

async function getPendingCount(): Promise<number> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/admin/listings?status=PENDING_REVIEW&limit=1`,
      { cache: "no-store" }
    );
    if (!res.ok) return 0;
    const json = await res.json();
    return json.total ?? 0;
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

  if (!session)                       redirect("/login");
  if (session.user.role !== "ADMIN")  redirect("/");

  const pendingCount = await getPendingCount();

  return (
    <AdminLayout pendingCount={pendingCount}>
      {children}
    </AdminLayout>
  );
}