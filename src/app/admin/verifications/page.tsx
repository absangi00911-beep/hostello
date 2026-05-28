import type { Metadata } from "next";
import { AdminVerificationsClient } from "@/components/admin/AdminVerificationsClient";

export const metadata: Metadata = { title: "Student verifications — Admin" };

export default function AdminVerificationsPage() {
  return <AdminVerificationsClient />;
}
