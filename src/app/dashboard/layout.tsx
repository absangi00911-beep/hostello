import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import styles from "./dashboard.module.css";
import DashboardNav from "@/components/features/dashboard/dashboard-nav";

export const metadata = {
  title: "Dashboard - HostelLo",
  description: "Manage your hostel, bookings, and guests",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user?.role !== "OWNER") {
    redirect("/login");
  }

  return (
    <div className={styles.dashboardContainer}>
      <DashboardNav />
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
