import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-10 pb-24 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-[var(--color-ink)] overflow-hidden">

          {/* Green glow */}
          <div
            className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full opacity-25 blur-[80px] pointer-events-none"
            style={{ background: "radial-gradient(circle, #00DC62 0%, transparent 70%)" }}
            aria-hidden="true"
          />

          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden="true"
          />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 px-8 sm:px-12 py-14">

            {/* Left */}
            <div className="max-w-xl">
              <p className="text-xs font-bold tracking-widest text-[var(--color-brand-400)] uppercase mb-4">
                For hostel owners
              </p>
              <h2
                className="text-4xl sm:text-5xl font-extrabold text-white leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Have a hostel?
                <br />
                <span
                  style={{
                    display: "inline-block",
                    WebkitTextStroke: "0.5px #00DC62",
                  }}
                >
                  List it free.
                </span>
              </h2>
              <p className="mt-5 text-white/50 text-base leading-relaxed max-w-md">
                Reach thousands of students searching near their university.
                You only pay a 5% commission when a booking is confirmed.
              </p>
            </div>

            {/* Right — CTAs */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
              <Link
                href="/signup?role=owner"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[var(--color-brand-500)] text-[var(--color-ink)] text-sm font-bold hover:bg-[var(--color-brand-400)] transition-colors"
              >
                List your hostel
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/how-it-works#owners"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-white text-sm font-semibold hover:bg-white/8 transition-colors"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
