import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import AdminNav from "@/components/features/admin/admin-nav";
import styles from "./admin.module.css";

export const metadata = {
  title: "Admin - HostelLo",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Only allow ADMIN role
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className={styles.adminLayout}>
      <AdminNav />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
