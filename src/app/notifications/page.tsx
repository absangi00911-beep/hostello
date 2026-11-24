import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DesktopAccountHeader } from "@/components/layout/DesktopAccountHeader";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { NotificationsPage } from "@/components/notifications/NotificationsPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/notifications")}`);
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
    role: session.user.role,
  };

  return (
    <>
      {session.user.role === "OWNER" ? (
        <OwnerPageHeader user={user} />
      ) : session.user.role === "ADMIN" ? (
        <AdminPageHeader user={user} />
      ) : (
        <DesktopAccountHeader user={user} />
      )}
      <NotificationsPage role={session.user.role} />
      {session.user.role === "STUDENT" && (
        <MobileTabNavigation activeTab={null} role="STUDENT" />
      )}
    </>
  );
}
