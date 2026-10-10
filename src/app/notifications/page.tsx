import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { PublicLayout } from "@/components/layout/PublicLayout";
import NotificationsContent from "@/components/notifications/NotificationsContent";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsRoute() {
  const session = await auth();

  if (!session) redirect("/login?callbackUrl=/notifications");
  if (session.user.role === "STUDENT") redirect("/dashboard/notifications");

  return (
    <PublicLayout noFooter>
      <div className="mx-auto w-full max-w-[1120px] px-4 py-6 pb-24 md:px-6 md:py-10">
        <NotificationsContent audience="workspace" />
      </div>
    </PublicLayout>
  );
}
