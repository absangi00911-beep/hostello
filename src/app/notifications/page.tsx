import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DesktopAccountHeader } from "@/components/layout/DesktopAccountHeader";
import { NotificationsPage } from "@/components/notifications/NotificationsPage";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Notifications | HostelLo" };

export default async function NotificationsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/notifications")}`);
  }

  return (
    <>
      <DesktopAccountHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
      <NotificationsPage role={session.user.role} />
    </>
  );
}
