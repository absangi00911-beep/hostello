import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRefundsPage } from "@/components/admin/AdminRefundsPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Refunds" };

export default async function AdminRefundsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/refunds")}`);
  }

  if (session.user.role !== "ADMIN") {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
      <AdminRefundsPage />
    </>
  );
}
