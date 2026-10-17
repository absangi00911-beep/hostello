import Link from "next/link";
import { ArrowRight, BedDouble, CheckCircle2 } from "lucide-react";
import { formatPKR } from "@/components/ui/shared";

interface RoomTypeCardProps {
  hostelSlug: string;
  room: {
    id: string;
    name: string;
    pricePerMonth: number;
    capacity: number;
    available: number;
    images?: string[];
  };
}

export function RoomTypeCard({ hostelSlug, room }: RoomTypeCardProps) {
  const roomUrl = `/hostels/${hostelSlug}/rooms/${encodeURIComponent(room.id)}`;

  return (
    <article className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 transition-colors duration-[var(--transition-fast)] hover:border-[var(--color-border-default)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] text-[color:var(--color-primary-deep)]">
            <BedDouble size={20} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[length:var(--text-body)] font-[600] text-[color:var(--color-text-heading)]">
              {room.name}
            </h3>
            <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
              Up to {room.capacity} occupant{room.capacity !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[length:var(--text-body)] font-[700] text-[color:var(--color-primary-deep)]">
            {formatPKR(room.pricePerMonth)}
          </p>
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">per month</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-[var(--color-border-subtle)] pt-4">
        <CheckCircle2
          size={15}
          strokeWidth={1.7}
          className={room.available > 0 ? "text-[color:var(--color-success)]" : "text-[color:var(--color-error)]"}
          aria-hidden="true"
        />
        <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]">
          {room.available > 0
            ? `${room.available} spot${room.available !== 1 ? "s" : ""} available`
            : "Currently full"}
        </span>
      </div>

      <Link
        href={roomUrl}
        className="mt-4 inline-flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-3 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-primary-deep)] no-underline transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-faint)] hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <span>View room details</span>
        <ArrowRight size={16} strokeWidth={1.7} aria-hidden="true" />
      </Link>
    </article>
  );
}
