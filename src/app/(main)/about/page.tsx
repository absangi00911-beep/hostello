import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Globe, Shield, Zap, Users, Heart } from "lucide-react";

export const revalidate = false;

export const metadata: Metadata = {
  title: "About HostelLo",
  description:
    "HostelLo connects university students with verified hostel owners. Safe, transparent, and student-focused accommodation in Pakistan.",
  openGraph: {
    title: "About HostelLo",
    description:
      "HostelLo connects university students with verified hostel owners. Safe, transparent, and student-focused accommodation in Pakistan.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest text-[var(--color-accent-600)] uppercase mb-3">
            Our story
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-[var(--color-text)] mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Making student housing simple
          </h1>
          <p className="text-lg text-[var(--color-muted)] max-w-2xl mx-auto">
            HostelLo is transforming how university students find and book accommodation in Pakistan. 
            We believe finding a place to stay should be easy, safe, and transparent.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-[var(--color-background-secondary)] rounded-2xl p-8 sm:p-12 mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">Our Mission</h2>
          <p className="text-[var(--color-muted)] leading-relaxed mb-6">
            We&apos;re on a mission to eliminate the friction and uncertainty in student housing. 
            Too many students waste weeks searching, communicating through WhatsApp, and worrying about scams. 
            Too many hostel owners struggle with no-shows, payment disputes, and unverified bookings.
          </p>
          <p className="text-[var(--color-muted)] leading-relaxed">
            HostelLo solves both sides of this problem with a single, secure platform where students can browse 
            verified hostels, compare options, and book with confidence — while owners get reliable bookings and 
            professional management tools.
          </p>
        </div>

        {/* Why We Exist */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8">Why We Built This</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[var(--color-background-secondary)] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Users className="w-6 h-6 text-[var(--color-accent-600)] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-[var(--color-text)] mb-2">For Students</h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    Finding hostel accommodation shouldn&apos;t mean worrying about scams, 
                    hidden fees, or dealing with unresponsive owners. We created a space where 
                    you can search, compare, and book with complete confidence.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[var(--color-background-secondary)] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-[var(--color-accent-600)] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-[var(--color-text)] mb-2">For Owners</h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    Managing a hostel shouldn&apos;t mean chasing students for verification or 
                    dealing with payment issues. We provide tools that let you manage bookings, 
                    analytics, and guest communication professionally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[var(--color-accent-100)] rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[var(--color-accent-600)]" />
              </div>
              <h3 className="font-semibold text-[var(--color-text)] mb-2">Safety First</h3>
              <p className="text-sm text-[var(--color-muted)]">
                Every hostel is verified. Every transaction is secure. Your trust is everything.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[var(--color-accent-100)] rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[var(--color-accent-600)]" />
              </div>
              <h3 className="font-semibold text-[var(--color-text)] mb-2">Simple & Fast</h3>
              <p className="text-sm text-[var(--color-muted)]">
                No complexity. No hidden fees. Book a hostel in minutes, not days.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[var(--color-accent-100)] rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-[var(--color-accent-600)]" />
              </div>
              <h3 className="font-semibold text-[var(--color-text)] mb-2">Student-Centric</h3>
              <p className="text-sm text-[var(--color-muted)]">
                Built by students, for students. Every feature prioritizes your needs.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="bg-gradient-to-r from-[var(--color-accent-50)] to-[var(--color-background-secondary)] rounded-2xl p-8 sm:p-12 mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8 text-center">Why Students Choose HostelLo</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-accent-600)] mb-2">100%</div>
              <p className="text-sm text-[var(--color-muted)]">Verified Hostels</p>
              <p className="text-xs text-[var(--color-muted-darker)] mt-2">Every listing manually checked</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-accent-600)] mb-2">24/7</div>
              <p className="text-sm text-[var(--color-muted)]">Support</p>
              <p className="text-xs text-[var(--color-muted-darker)] mt-2">Always here when you need us</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-accent-600)] mb-2">Free</div>
              <p className="text-sm text-[var(--color-muted)]">For Students</p>
              <p className="text-xs text-[var(--color-muted-darker)] mt-2">No hidden booking fees</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-accent-600)] mb-2">Pakistan</div>
              <p className="text-sm text-[var(--color-muted)]">Wide Coverage</p>
              <p className="text-xs text-[var(--color-muted-darker)] mt-2">All major university cities</p>
            </div>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8">What We Offer</h2>
          <div className="space-y-4">
            {[
              "Verified hostel listings with photos and reviews from real students",
              "Compare multiple options side by side before deciding",
              "Direct messaging with hostel owners for questions",
              "Secure payment processing — pay only when booking is confirmed",
              "Booking management dashboard for tracking your reservations",
              "Email and SMS notifications for booking updates",
              "Student-friendly pricing with no hidden fees",
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-[var(--color-background-secondary)] rounded-lg">
                <CheckCircle className="w-5 h-5 text-[var(--color-accent-600)] flex-shrink-0 mt-0.5" />
                <span className="text-[var(--color-muted)]">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="bg-[var(--color-background-secondary)] rounded-2xl p-8 sm:p-12 mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8 text-center">Built With Trust</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--color-accent-600)]" />
                Transparent & Secure
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                All hostel owners are verified with contact information and reviews from real students. 
                Every booking is protected, and all payments are processed securely through trusted payment gateways.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--color-accent-600)]" />
                Your Safety Matters
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                We use industry-standard security practices to protect your personal information. 
                All transactions are encrypted, and we follow best practices for data privacy.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text)] mb-6">
            Ready to find your perfect hostel?
          </h2>
          <p className="text-[var(--color-muted)] mb-8 max-w-xl mx-auto">
            Join thousands of students already using HostelLo to find safe, affordable, and convenient accommodation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/hostels"
              className="px-8 py-3 bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] text-white rounded-lg font-semibold transition-colors"
            >
              Browse Hostels
            </Link>
            <Link
              href="/help"
              className="px-8 py-3 border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background-secondary)] rounded-lg font-semibold transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Footer Contact */}
        <div className="mt-16 pt-12 border-t border-[var(--color-border)] text-center">
          <p className="text-sm text-[var(--color-muted)] mb-4">
            Questions? We&apos;re here to help.
          </p>
          <Link
            href="/contact"
            className="text-[var(--color-accent-600)] hover:text-[var(--color-accent-700)] font-semibold text-sm"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </div>
  );
}
