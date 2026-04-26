"use client";

import Link from "next/link";
import { Search, BookOpen, Building2, CreditCard, ShieldCheck, MessageCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQ_SECTIONS = [
  {
    icon: Search,
    title: "Finding a hostel",
    faqs: [
      {
        q: "How do I search for hostels?",
        a: "Go to the Browse page and use filters to narrow down by city, price range, gender policy, amenities (WiFi, kitchen, laundry), and nearby universities. You can also search by specific street address or use 'Recently Viewed' to revisit hostels you've looked at before.",
      },
      {
        q: "What does 'Verified' mean?",
        a: "Verified hostels have been manually checked by our team. We contact every hostel, verify their details, visit if possible, and ensure they meet our safety standards. A blue verified badge means you can book with confidence.",
      },
      {
        q: "How do I compare hostels?",
        a: "Click the heart icon on any hostel to add it to your compare list (you can add up to 5). Your compare list appears at the bottom of the screen as a 'Compare Bar'. Tap it anytime to see side-by-side details like price, amenities, location, and reviews.",
      },
      {
        q: "Can I see reviews from other students?",
        a: "Yes. Every hostel shows an average rating and individual reviews from students who have actually stayed there. Reviews include ratings, comments, and the reviewer's name. Only verified bookings can leave reviews to prevent fake ratings.",
      },
    ],
  },
  {
    icon: BookOpen,
    title: "Bookings",
    faqs: [
      {
        q: "How do I make a booking?",
        a: "After selecting your dates and viewing a hostel, click 'Request to Book'. You'll enter your check-in and check-out dates, and then proceed to payment. Once you pay, the owner gets a notification and will confirm your booking. You'll receive a confirmation SMS and email.",
      },
      {
        q: "Can I cancel a booking?",
        a: "Cancellation policies vary by hostel. Most allow free cancellation up to 48 hours before check-in. Check the hostel's cancellation policy in the booking details. To cancel, go to your bookings, click the booking, and select 'Cancel Booking'. Any refunds will be processed within 5-7 business days.",
      },
      {
        q: "What happens if the owner declines my booking?",
        a: "If the owner doesn't confirm your booking within 24 hours, it's automatically cancelled and your payment is refunded in full. The owner can only decline within this window. Once confirmed, they can't cancel (you're protected).",
      },
      {
        q: "Can I modify my booking after it's confirmed?",
        a: "You can extend your stay if the hostel has availability. Go to your bookings, select the booking, and choose 'Extend Stay'. Dates can't be changed retroactively, but you can cancel and rebook if needed. Check the cancellation policy for fees.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Payments",
    faqs: [
      {
        q: "Which payment methods are accepted?",
        a: "We accept Jazzcash, EasyPaisa, Safepay, and bank card (Visa/Mastercard). All payments are processed securely. For mobile wallet users, you can pay via Jazzcash or EasyPaisa directly from the checkout page. Bank cards are charged in PKR.",
      },
      {
        q: "When is my payment collected?",
        a: "Payment is collected immediately when you click 'Confirm Booking'. Your booking request is sent to the owner at this time. If the owner doesn't confirm within 24 hours, your payment is automatically refunded.",
      },
      {
        q: "How do refunds work?",
        a: "Refunds are processed within 5-7 business days to your original payment method. This includes failed bookings (owner declined), cancellations within the allowed period, or payment disputes. You'll get a refund notification email with your refund reference.",
      },
      {
        q: "Is my payment secure?",
        a: "Yes. All payments are encrypted and processed through PCI-compliant payment gateways. We never store your full card details. Payment data is handled by Safepay, Jazzcash, and EasyPaisa directly.",
      },
    ],
  },
  {
    icon: Building2,
    title: "For hostel owners",
    faqs: [
      {
        q: "How do I list my hostel?",
        a: "Sign up as an Owner, verify your email, and go to Dashboard > List New Hostel. Fill in basic info (name, address, price, amenities), upload photos, set house rules, and choose your payment method. Your listing goes live immediately and appears in search once verified.",
      },
      {
        q: "What is the commission fee?",
        a: "HostelLo charges 8% commission on confirmed bookings. This is only deducted when a student actually stays at your hostel, not on cancellations. There are no setup fees, subscription charges, or hidden costs. What you see is what you pay.",
      },
      {
        q: "How do I get verified?",
        a: "Our team reviews your listing within 24 hours. We check your photos, location accuracy, contact details, and hostel details. Verification ensures students trust your listing. Most hostels are verified immediately if all details are correct.",
      },
      {
        q: "How do I manage bookings?",
        a: "Go to Dashboard > Bookings. You'll see all incoming requests with check-in/check-out dates and guest details. Confirm or decline bookings within 24 hours. Once confirmed, the booking appears in your 'Upcoming' tab. You'll get SMS and email notifications for every booking event.",
      },
      {
        q: "How do I contact students?",
        a: "Students can message you directly from your listing. You'll see messages in Dashboard > Messages. We encourage owners to respond within 4 hours to questions about amenities, house rules, or check-in instructions.",
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Safety & trust",
    faqs: [
      {
        q: "How are hostels verified?",
        a: "We manually verify every hostel by checking contact details, visiting when possible, verifying ownership, and confirming basic information. Verified hostels display a blue badge. If we can't verify a listing, we don't show it to students.",
      },
      {
        q: "Are reviews real?",
        a: "Yes. Only students who made a confirmed booking (and the stay has started) can leave a review. We filter reviews for spam and reject fake or inappropriate content. If you suspect a fake review, you can report it.",
      },
      {
        q: "What if I have a problem with a booking?",
        a: "Contact us immediately via the Report page or email support@hostello.pk. Include your booking reference, booking date, and details of the issue. Our team investigates and responds within 24 hours. For safety concerns, contact local authorities.",
      },
      {
        q: "How do you protect my personal data?",
        a: "We follow industry-standard security practices. Your data is encrypted in transit and at rest. We don't share your details with third parties except for payment processing. Read our Privacy Policy for full details.",
      },
    ],
  },
  {
    icon: MessageCircle,
    title: "Contact & support",
    faqs: [
      {
        q: "How do I contact support?",
        a: "Email us at support@hostello.pk or use the Contact page to send a message. We typically respond within 24 hours. For urgent issues, include 'URGENT' in your subject line. You can also check our Help Centre for common answers.",
      },
      {
        q: "What's your response time?",
        a: "We aim to respond to all inquiries within 24 hours. Urgent issues (safety concerns, payment problems) get priority and are reviewed within 4 hours. Support is available every day.",
      },
    ],
  },
];

function FAQAccordion({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="border border-[var(--color-border)] rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full px-5 py-4 flex items-start justify-between gap-3 hover:bg-[var(--color-background-secondary)] transition-colors text-left"
          >
            <span className="font-medium text-[var(--color-text)] text-sm">{faq.q}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--color-muted)] flex-shrink-0 transition-transform mt-0.5",
                openIndex === i && "rotate-180"
              )}
            />
          </button>
          {openIndex === i && (
            <div className="px-5 py-4 bg-[var(--color-background-secondary)] border-t border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1
            className="text-4xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Help Centre
          </h1>
          <p className="mt-3 text-base text-[var(--color-muted)]">
            Find answers to common questions. For additional support, email{" "}
            <a href="mailto:support@hostello.pk" className="font-medium text-[var(--color-accent-600)] hover:underline">
              support@hostello.pk
            </a>
          </p>
        </div>

        <div className="space-y-12">
          {FAQ_SECTIONS.map(({ icon: Icon, title, faqs }) => (
            <div key={title}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-100)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[var(--color-accent-600)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">{title}</h2>
              </div>
              <FAQAccordion faqs={faqs} />
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-[var(--color-accent-50)] border border-[var(--color-accent-200)]">
          <p className="text-base font-medium text-[var(--color-text)] mb-2">
            Didn't find your answer?
          </p>
          <p className="text-sm text-[var(--color-muted)] mb-5">
            Our support team is here to help. We respond to all inquiries within 24 hours.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-2.5 rounded-lg bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] text-white text-sm font-semibold transition-colors"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
