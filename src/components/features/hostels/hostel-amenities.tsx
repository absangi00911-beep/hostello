import { AMENITY_MAP } from "@/config/amenities";

interface HostelAmenitiesProps {
  amenities: string[];
  rules: string[];
}

export function HostelAmenities({ amenities, rules }: HostelAmenitiesProps) {
  const resolved = amenities.map((id) => AMENITY_MAP[id]).filter(Boolean);

  return (
    <div className="space-y-10">
      {/* Amenities */}
      {resolved.length > 0 && (
        <section>
          <h2
            className="text-xl font-extrabold text-[var(--color-ink)] mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What's included
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {resolved.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-ink)] transition-colors"
              >
                <span className="text-xl flex-shrink-0">{a.emoji}</span>
                <span className="text-sm font-medium text-[var(--color-ink-soft)]">{a.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rules */}
      {rules.length > 0 && (
        <section>
          <h2
            className="text-xl font-extrabold text-[var(--color-ink)] mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            House rules
          </h2>
          <ul className="space-y-3">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--color-ink-soft)]">
                <span className="w-5 h-5 rounded-full bg-[var(--color-ground)] border border-[var(--color-border)] flex items-center justify-center text-xs font-bold text-[var(--color-ink)] flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
