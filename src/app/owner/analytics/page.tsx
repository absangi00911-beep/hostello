import { redirect } from "next/navigation";

/** Keep bookmarked analytics URLs from landing on a removed owner feature. */
export default function OwnerAnalyticsPage() {
  redirect("/owner/dashboard");
}
