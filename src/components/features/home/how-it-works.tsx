const STEPS = [
  {
    number: "01",
    title: "Search near your university",
    body: "Enter your university or area. Filter by price, gender, amenities. See all verified listings in one place.",
  },
  {
    number: "02",
    title: "Compare hostels side-by-side",
    body: "View verified photos, real student reviews, and pricing. Compare up to 3 hostels to find your best fit.",
  },
  {
    number: "03",
    title: "Message the owner directly",
    body: "Ask questions about deposits, timings, meals. Get answers straight from the owner — no middlemen.",
  },
  {
    number: "04",
    title: "Book and get confirmed",
    body: "Pay securely through HostelLo. Get a booking reference and owner's contact to arrange move-in.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 sm:py-32 bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:gap-16">
          {/* Heading */}
          <div className="lg:w-80 flex-shrink-0 mb-12 lg:mb-0">
            <p className="text-sm font-bold tracking-widest text-[var(--color-brand-600)] uppercase mb-4">
              Simple Process
            </p>
            <h2
              className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)] leading-tight mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Find & book in minutes
            </h2>
            <p className="text-lg text-[var(--color-ink-muted)] leading-relaxed">
              No agents. No confusion. Just you, the hostel, and a fair deal.
            </p>
          </div>

          {/* Steps */}
          <div className="flex-1">
            <div className="space-y-8">
              {STEPS.map((step, idx) => (
                <div key={step.number} className="flex gap-6">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-xl bg-[var(--color-brand-600)] flex items-center justify-center text-white font-bold text-lg"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {step.number}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className="w-0.5 h-12 bg-[var(--color-border)] mt-2 mb-2" />
                    )}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-bold text-[var(--color-ink)] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[var(--color-ink-muted)] leading-relaxed max-w-md">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}