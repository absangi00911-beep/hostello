import type { Metadata } from "next";
import { LegalPlaceholderPage } from "@/components/legal/LegalPlaceholderPage";
import { getHeaderUser } from "@/lib/auth/header-user";

export const metadata: Metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  return (
    <LegalPlaceholderPage title="Privacy Policy" user={await getHeaderUser()} />
  );
}
