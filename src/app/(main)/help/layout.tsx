import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Centre",
  description: "Answers to common questions about HostelLo — bookings, payments, safety, and support.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
