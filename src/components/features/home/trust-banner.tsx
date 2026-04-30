import { ClipboardCheck, ShieldCheck, UserCheck } from "lucide-react";

const ITEMS = [
  {
    icon: ClipboardCheck,
    stat: "Visited first",
    title: "Physically verified",
    body: "Our team visits every hostel before it's listed. Photos are taken on-site. Listings that don't match reality are removed.",
  },
  {
    icon: ShieldCheck,
    stat: "Stays only",
    title: "Reviews from residents",
    body: "A student can only leave a review after their booking is marked complete. No review from someone who didn't stay.",
  },
  {
    icon: UserCheck,
    stat: "No middleman",
    title: "Direct with the owner",
    body: "Your message goes to the hostel owner, not an agent. You see the owner's name and their other listings before you book.",
  },
];

export function TrustBanner() {
  return (
    <section className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)]">
          {ITEMS.map(({ icon: Icon, stat, title, body }) => (
            <div key={title} className="flex items-start gap-5 py-8 sm:px-10 first:pl-0 last:pr-0">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--color-ground)] border border-[var(--color-border)] flex items-center justify-center">
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