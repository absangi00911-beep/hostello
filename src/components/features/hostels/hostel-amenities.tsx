import { AMENITY_MAP } from "@/config/amenities";

interface HostelAmenitiesProps {
  amenities: string[];
  rules: string[];
}

export function HostelAmenities({ amenities, rules }: HostelAmenitiesProps) {
  const resolved = amenities.map((id) => AMENITY_MAP[id]).filter(Boolean);

  return (
    <div className="space-y-12">
      {/* Amenities */}
      {resolved.length > 0 && (
        <section>
          <h2
            className="text-2xl font-extrabold text-[var(--color-ink)] mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What's included
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {resolved.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-500)] hover:shadow-card transition-all"
              >
                <span className="text-2xl flex-shrink-0">{a.emoji}</span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">{a.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rules */}
      {rules.length > 0 && (
        <section>
          <h2
            className="text-2xl font-extrabold text-[var(--color-ink)] mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            House rules
          </h2>
          <ul className="space-y-3">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-4 text-base text-[var(--color-ink-soft)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-brand-100)] border border-[var(--color-brand-200)] flex items-center justify-center text-sm font-bold text-[var(--color-brand-700)] flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
