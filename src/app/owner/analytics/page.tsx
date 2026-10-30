import { notFound, redirect } from "next/navigation";
import { AnalyticsPage } from "@/components/owner/AnalyticsPage";
import { auth } from "@/lib/auth/config";

export default async function OwnerAnalyticsRoute() {
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/owner/analytics")}`);
  }

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    notFound();
  }

  return <AnalyticsPage />;
}
