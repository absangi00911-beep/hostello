import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPaymentEventsPage } from "@/components/admin/AdminPaymentEventsPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Payment events" };

export default async function AdminPaymentEventsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/payment-events")}`);
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
      <AdminPaymentEventsPage />
    </>
  );
}
