import type { Metadata } from "next";
import { LegalPlaceholderPage } from "@/components/legal/LegalPlaceholderPage";
import { getHeaderUser } from "@/lib/auth/header-user";

export const metadata: Metadata = { title: "Terms | HostelLo" };

export default async function TermsPage() {
  return (
    <LegalPlaceholderPage title="Terms of Service" user={await getHeaderUser()} />
  );
}
