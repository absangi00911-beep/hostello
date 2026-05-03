import { ClipboardCheck, ShieldCheck, UserCheck } from "lucide-react";

const ITEMS = [
  {
    icon: ClipboardCheck,
    title: "Every listing verified in-person",
    body: "Our team visits before listing. Real photos. Real info. Listings that don't match are removed immediately.",
  },
  {
    icon: ShieldCheck,
    title: "Reviews from actual residents",
    body: "Only students who've stayed can review. No fake ratings. See honest feedback about hostel quality and management.",
  },
  {
    icon: UserCheck,
    title: "Direct contact with owners",
    body: "No middlemen or agents. Message the owner directly, see their name, and get clear answers before booking.",
  },
];

export function TrustBanner() {
  return (
    <section className="bg-[var(--color-surface)] border-y border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {ITEMS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-100)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-[var(--color-brand-600)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-ink)] mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                    {body}
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