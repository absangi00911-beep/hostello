import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminVerificationsPage } from "@/components/admin/AdminVerificationsPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Student verification" };

export default async function AdminVerificationsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/verifications")}`);
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
      <AdminVerificationsPage />
    </>
  );
}
