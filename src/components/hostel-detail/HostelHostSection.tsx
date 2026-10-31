import Image from "next/image";
import { MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { HostelInquiryForm } from "@/components/hostel-detail/HostelInquiryForm";

type HostResponseSummary = {
  guestStartedThreadCount: number;
  repliedThreadCount: number;
  medianResponseSeconds: number | null;
};

interface HostelHostSectionProps {
  hostelId: string;
  hostelName: string;
  rating: number;
  reviewCount: number;
  host: {
    name: string;
    avatar: string | null;
    bio: string | null;
    city: string | null;
    createdAt: Date;
    responseSummary: HostResponseSummary | null;
  };
  isOwner: boolean;
  viewerRole: "STUDENT" | "OWNER" | "ADMIN" | null;
}

function formatResponseTime(seconds: number) {
  if (seconds < 60) return "under a minute";

  if (seconds < 3_600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  if (seconds < 86_400) {
    const hours = Math.round(seconds / 3_600);
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  const days = Math.round(seconds / 86_400);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export function HostelHostSection({
  hostelId,
  hostelName,
  rating,
  reviewCount,
  host,
  isOwner,
  viewerRole,
}: HostelHostSectionProps) {
  const summary = host.responseSummary;
  const responseRate =
    summary && summary.guestStartedThreadCount > 0
      ? Math.round(
          (summary.repliedThreadCount / summary.guestStartedThreadCount) * 100,
        )
      : null;
  const medianResponseSeconds = summary?.medianResponseSeconds ?? null;
  const membershipDate = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(host.createdAt);
  const showInquiryAction =
    !isOwner && (viewerRole === null || viewerRole === "STUDENT");

  return (
    <section
      aria-labelledby="hostel-host-title"
      className="hostel-host-section min-w-0 border-y border-line py-5"
      role="region"
    >
      <h2 id="hostel-host-title" className="mb-4 text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">
        Meet your host
      </h2>
      <div className="hostel-host-layout grid gap-[clamp(24px,3vw,40px)] [grid-template-columns:minmax(0,0.9fr)_minmax(0,1.1fr)] [@media(max-width:720px)]:grid-cols-1 md:[grid-template-columns:minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="hostel-host-primary grid min-w-0 gap-5">
          <div
            aria-label="Host profile"
            className="hostel-host-card grid w-full max-w-[440px] items-center gap-4 rounded-xl border border-line bg-white p-5 [grid-template-columns:minmax(0,1fr)_minmax(108px,0.46fr)]"
            role="group"
          >
            <div className="hostel-host-card-identity grid min-w-0 justify-items-center gap-2 text-center">
              {host.avatar ? (
                <Image
                  alt={host.name}
                  className="hostel-host-avatar h-[88px] w-[88px] rounded-full object-cover"
                  height={88}
                  src={host.avatar}
                  unoptimized
                  width={88}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="hostel-host-avatar-fallback grid h-[88px] w-[88px] place-items-center rounded-full bg-brand-soft text-[1.5rem] font-bold text-brand-dark"
                >
                  {host.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}
              <div className="hostel-host-identity min-w-0">
                <h3 className="m-0 text-[clamp(1.125rem,1.8vw,1.4rem)] font-[650] leading-[1.15] [overflow-wrap:anywhere]">
                  {host.name}
                </h3>
                <p className="mt-1 text-[0.84rem] text-muted">Host</p>
              </div>
            </div>
            <dl
              aria-label={`Details for ${hostelName}`}
              className="hostel-host-listing-stats m-0 grid min-w-0"
            >
              <div className="grid gap-[3px] py-2">
                <dt className="text-[0.72rem] leading-[1.3] text-muted">Hostel reviews</dt>
                <dd className="m-0 flex items-center gap-1 text-[1.05rem] font-semibold [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]">
                  {reviewCount}
                </dd>
              </div>
              <div className="grid gap-[3px] border-t border-line py-2">
                <dt className="text-[0.72rem] leading-[1.3] text-muted">Hostel rating</dt>
                <dd className="m-0 flex items-center gap-1 text-[1.05rem] font-semibold [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]">
                  {reviewCount > 0 ? rating.toFixed(1) : "—"}
                  {reviewCount > 0 && (
                    <Star aria-hidden="true" fill="currentColor" size={14} />
                  )}
                </dd>
              </div>
              <div className="grid gap-[3px] border-t border-line py-2">
                <dt className="text-[0.72rem] leading-[1.3] text-muted">Member since</dt>
                <dd className="m-0 text-[0.82rem] [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]">
                  {membershipDate}
                </dd>
              </div>
            </dl>
          </div>
          <div className="hostel-host-facts grid gap-2.5">
            {host.city && (
              <p className="flex min-w-0 items-start gap-3 text-[0.9rem] leading-[1.55] text-ink">
                <MapPin aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
                <span className="min-w-0 whitespace-pre-line [overflow-wrap:anywhere]">
                  Based in {host.city}
                </span>
              </p>
            )}
            {host.bio && (
              <p className="flex min-w-0 items-start gap-3 text-[0.9rem] leading-[1.55] text-ink">
                <MessageCircle aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
                <span className="min-w-0 whitespace-pre-line [overflow-wrap:anywhere]">
                  {host.bio}
                </span>
              </p>
            )}
          </div>
        </div>

        <aside aria-label="Host details" className="hostel-host-contact grid min-w-0 content-start justify-items-start gap-4">
          <h3 className="m-0 text-base font-semibold text-ink">Host details</h3>
          {responseRate !== null && (
            <dl aria-label="Host response details" className="hostel-host-metrics m-0 grid gap-1.5">
              <div className="flex flex-wrap gap-1">
                <dt className="text-[0.92rem] leading-[1.4] text-ink after:content-[':']">Response rate</dt>
                <dd className="m-0 text-[0.92rem] font-medium [font-variant-numeric:tabular-nums]">
                  {responseRate}%
                </dd>
              </div>
              {medianResponseSeconds !== null && (
                <div className="flex flex-wrap gap-1">
                  <dt className="text-[0.92rem] leading-[1.4] text-ink after:content-[':']">Response time</dt>
                  <dd className="m-0 text-[0.92rem] font-medium [font-variant-numeric:tabular-nums]">
                    {formatResponseTime(medianResponseSeconds)}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {showInquiryAction && (
            <details className="hostel-host-inquiry w-full max-w-[560px]">
              <summary className="inline-flex min-h-[48px] cursor-pointer list-none items-center justify-center rounded-lg bg-surface-muted px-6 text-[0.94rem] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-dark [&::-webkit-details-marker]:hidden">
                Message host
              </summary>
              <HostelInquiryForm
                hostelId={hostelId}
                hostelName={hostelName}
                isSignedInStudent={viewerRole === "STUDENT"}
              />
            </details>
          )}

          <p className="hostel-host-protection mt-1 flex w-full max-w-[560px] items-start gap-3 border-t border-line pt-3.5 text-[0.82rem] leading-[1.55] text-muted">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-brand-dark" size={20} />
            <span>For your safety, keep conversations with hosts on HostelLo.</span>
          </p>
        </aside>
      </div>
    </section>
  );
}
