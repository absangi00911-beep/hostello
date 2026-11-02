import type { Metadata } from "next";
import { LegalPlaceholderPage } from "@/components/legal/LegalPlaceholderPage";

export const metadata: Metadata = { title: "Terms | HostelLo" };

export default function TermsPage() {
  return <LegalPlaceholderPage title="Terms of Service" />;
}
