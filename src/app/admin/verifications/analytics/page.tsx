// Path: src/app/admin/verifications/analytics/page.tsx

import type { Metadata } from "next";
import { VerificationAnalyticsClient } from "@/components/admin/VerificationAnalyticsClient";

export const metadata: Metadata = { title: "Verification analytics — Admin" };

export default function VerificationAnalyticsPage() {
  return <VerificationAnalyticsClient />;
}
