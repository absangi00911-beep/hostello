import type { Metadata } from "next";
import { LegalPlaceholderPage } from "@/components/legal/LegalPlaceholderPage";

export const metadata: Metadata = { title: "Privacy | HostelLo" };

export default function PrivacyPage() {
  return <LegalPlaceholderPage title="Privacy Policy" />;
}
