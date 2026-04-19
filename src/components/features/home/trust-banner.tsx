import { ShieldCheck, Star, Clock } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    stat: "100%",
    title: "Verified listings",
    body: "Every hostel is physically checked before it goes live.",
  },
  {
    icon: Star,
    stat: "Real only",
    title: "Honest reviews",
    body: "Only residents who booked through us can leave a review.",
  },
  {
    icon: Clock,
    stat: "< 5 min",
    title: "Book fast",
    body: "No agents, no calls. Message the owner and confirm directly.",
  },
];

export function TrustBanner() {
  return (
    <section className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)]">
          {ITEMS.map(({ icon: Icon, stat, title, body }) => (
            <div key={title} className="flex items-start gap-5 py-8 sm:px-10 first:pl-0 last:pr-0">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--color-brand-500)] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[var(--color-ink)]" />
              </div>
              <div>
                <p
                  className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-0.5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {stat}
                </p>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
                <p className="text-sm text-[var(--color-muted)] mt-0.5 leading-snug">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
