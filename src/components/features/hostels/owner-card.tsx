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
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">

      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-ink)] text-white flex items-center justify-center text-base font-bold overflow-hidden flex-shrink-0">
          {owner.avatar ? (
            <Image src={owner.avatar} alt={owner.name} width={48} height={48} className="object-cover" />
          ) : (
            getInitials(owner.name)
          )}
        </div>
        <div>
          <p className="font-bold text-[var(--color-ink)] text-sm">{owner.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] mt-0.5">
            <Building2 className="w-3 h-3" />
            <span>{owner._count.hostels} listing{owner._count.hostels !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] pb-4 border-b border-[var(--color-border)]">
        <CalendarDays className="w-3.5 h-3.5" />
        <span>On HostelLo since {formatDate(owner.createdAt)}</span>
      </div>

      <div className="pt-4">
        {hasConfirmedBooking && owner.phone ? (
          /* Show phone only post-confirmation — legitimate contact for move-in coordination */
          <a
            href={`tel:${owner.phone}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call owner
          </a>
        ) : !hasConfirmedBooking ? (
          /* Pre-confirmation: prompt to use messaging system instead — prevents platform bypass */
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--color-ground)] border border-[var(--color-border)]">
            <Lock className="w-3.5 h-3.5 text-[var(--color-muted)] flex-shrink-0" />
            <p className="text-xs text-[var(--color-muted)]">
              Contact details shared after booking is confirmed.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
