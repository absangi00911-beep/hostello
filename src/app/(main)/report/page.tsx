import type { Metadata } from "next";
import { Flag } from "lucide-react";
import { ReportForm } from "@/components/features/contact/report-form";

export const metadata: Metadata = {
  title: "Report an Issue",
  description: "Report a problem with a listing, review, or payment on HostelLo.",
};

export const revalidate = false;

export default function ReportPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <Flag className="w-5 h-5 text-red-500" />
          </div>
          <h1
            className="text-3xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Report an issue
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            We review every report. Serious issues are escalated within 4 hours.
          </p>
        </div>

        <ReportForm />
      </div>
    </div>
  );
}
