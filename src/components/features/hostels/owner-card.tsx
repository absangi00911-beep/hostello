import Image from "next/image";
import { CalendarDays, Building2, Phone, Lock } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

interface OwnerCardProps {
  owner: {
    id: string;
    name: string;
    avatar: string | null;
    phone: string | null;
    createdAt: Date;
    _count: { hostels: number };
  };
  /** Only show contact details to users with a confirmed booking */
  hasConfirmedBooking?: boolean;
}

export function OwnerCard({ owner, hasConfirmedBooking = false }: OwnerCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-card">

      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-lg bg-[var(--color-brand-600)] text-white flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
          {owner.avatar ? (
            <Image src={owner.avatar} alt={owner.name} width={56} height={56} className="object-cover" />
          ) : (
            getInitials(owner.name)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[var(--color-ink)] text-base">{owner.name}</p>
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] mt-1">
            <Building2 className="w-4 h-4" />
            <span className="font-medium">{owner._count.hostels} listing{owner._count.hostels !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)] pb-5 border-b border-[var(--color-border)]">
        <CalendarDays className="w-4 h-4 flex-shrink-0" />
        <span>On HostelLo since {formatDate(owner.createdAt)}</span>
      </div>

      <div className="pt-5">
        {/* SECURITY: Only show phone link if explicitly authorized AND phone exists */}
        {hasConfirmedBooking && owner.phone ? (
          /* Show phone only post-confirmation — legitimate contact for move-in coordination */
          <a
            href={`tel:${owner.phone}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-base font-bold transition-colors"
          >
            <Phone className="w-5 h-5" />
            Call owner
          </a>
        ) : !hasConfirmedBooking && hasConfirmedBooking !== undefined ? (
          /* Pre-confirmation: prompt to use messaging system instead — prevents platform bypass */
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--color-ground)] border border-[var(--color-border)]">
            <Lock className="w-4 h-4 text-[var(--color-ink-muted)] flex-shrink-0" />
            <p className="text-sm text-[var(--color-ink-muted)] font-medium">
              Contact details shared after booking is confirmed.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
