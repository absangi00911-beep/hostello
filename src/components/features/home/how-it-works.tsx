const STEPS = [
  {
    number: "01",
    title: "Search & filter",
    body: "Enter your university or city. Filter by price, gender, and amenities. Results update instantly.",
  },
  {
    number: "02",
    title: "Compare options",
    body: "Add up to three hostels side by side. See amenities, price, and ratings in one view.",
  },
  {
    number: "03",
    title: "Contact the owner",
    body: "Message the owner directly. Ask questions, arrange a visit, confirm availability.",
  },
  {
    number: "04",
    title: "Book and move in",
    body: "Pay via JazzCash, EasyPaisa, or card. Get a confirmation and receipt by email instantly.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-20">

          {/* Left — sticky heading */}
          <div className="lg:w-80 flex-shrink-0 mb-14 lg:mb-0 lg:sticky lg:top-28">
            <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-4">
              How it works
            </p>
            <h2
              className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)] leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              From search to move-in.
            </h2>
            <p className="mt-4 text-[var(--color-muted)] text-base leading-relaxed">
              The whole process happens on HostelLo — no calls to agents, no WhatsApp back-and-forth.
            </p>
          </div>

          {/* Right — steps */}
          <div className="flex-1 space-y-0 divide-y divide-[var(--color-border)]">
            {STEPS.map((step) => (
              <div key={step.number} className="flex items-start gap-6 py-8 group">
                <span
                  className="flex-shrink-0 text-5xl font-extrabold text-[var(--color-brand-500)] leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.number}
                </span>
                <div className="pt-1">
                  <h3
                    className="text-xl font-bold text-[var(--color-ink)] mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[var(--color-muted)] text-sm leading-relaxed max-w-lg">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
