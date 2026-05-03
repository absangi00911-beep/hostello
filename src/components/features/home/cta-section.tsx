import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-24 sm:py-32 bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] overflow-hidden">
          
          {/* Accent blob */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{
              background: "radial-gradient(circle, #00f570 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="relative px-8 sm:px-12 py-16 sm:py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              
              {/* Left: Headline & copy */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/15">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-bold text-white/80 tracking-wide uppercase">
                    For hostel owners
                  </p>
                </div>

                <h2
                  className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Ready to reach more students?
                </h2>

                <p className="text-lg text-white/80 leading-relaxed max-w-md mb-8">
                  List your hostel for free. Reach thousands of students actively searching for accommodation. Only pay 5% commission on confirmed bookings.
                </p>

                {/* Key benefits */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                    <span>In-person verification boost trust</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                    <span>Direct communication with students</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                    <span>No upfront fees, only commissions</span>
                  </li>
                </ul>
              </div>

              {/* Right: CTAs */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/signup?role=owner"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-white text-[var(--color-brand-700)] text-lg font-bold hover:bg-white/90 transition-colors btn-press"
                >
                  List your hostel free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/how-it-works#owners"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg border-2 border-white/30 text-white text-lg font-semibold hover:bg-white/10 transition-colors btn-press"
                >
                  Learn more about hosting
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
