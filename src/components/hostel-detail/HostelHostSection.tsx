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
      className="hostel-host-section"
      role="region"
    >
      <h2 id="hostel-host-title">Meet your host</h2>
      <div className="hostel-host-layout">
        <div className="hostel-host-primary">
          <div
            aria-label="Host profile"
            className="hostel-host-card"
            role="group"
          >
            <div className="hostel-host-card-identity">
              {host.avatar ? (
                <Image
                  alt={host.name}
                  className="hostel-host-avatar"
                  height={88}
                  src={host.avatar}
                  unoptimized
                  width={88}
                />
              ) : (
                <span aria-hidden="true" className="hostel-host-avatar-fallback">
                  {host.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}
              <div className="hostel-host-identity">
                <h3>{host.name}</h3>
                <p>Host</p>
              </div>
            </div>
            <dl
              aria-label={`Details for ${hostelName}`}
              className="hostel-host-listing-stats"
            >
              <div>
                <dt>Hostel reviews</dt>
                <dd>{reviewCount}</dd>
              </div>
              <div>
                <dt>Hostel rating</dt>
                <dd>
                  {reviewCount > 0 ? rating.toFixed(1) : "—"}
                  {reviewCount > 0 && (
                    <Star aria-hidden="true" fill="currentColor" size={14} />
                  )}
                </dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{membershipDate}</dd>
              </div>
            </dl>
          </div>
          <div className="hostel-host-facts">
            {host.city && (
              <p>
                <MapPin aria-hidden="true" size={20} />
                <span>Based in {host.city}</span>
              </p>
            )}
            {host.bio && (
              <p>
                <MessageCircle aria-hidden="true" size={20} />
                <span>{host.bio}</span>
              </p>
            )}
          </div>
        </div>

        <aside aria-label="Host details" className="hostel-host-contact">
          <h3>Host details</h3>
          {responseRate !== null && (
            <dl aria-label="Host response details" className="hostel-host-metrics">
              <div>
                <dt>Response rate</dt>
                <dd>{responseRate}%</dd>
              </div>
              {medianResponseSeconds !== null && (
                <div>
                  <dt>Response time</dt>
                  <dd>{formatResponseTime(medianResponseSeconds)}</dd>
                </div>
              )}
            </dl>
          )}

          {showInquiryAction && (
            <details className="hostel-host-inquiry">
              <summary>Message host</summary>
              <HostelInquiryForm
                hostelId={hostelId}
                hostelName={hostelName}
                isSignedInStudent={viewerRole === "STUDENT"}
              />
            </details>
          )}

          <p className="hostel-host-protection">
            <ShieldCheck aria-hidden="true" size={20} />
            <span>For your safety, keep conversations with hosts on HostelLo.</span>
          </p>
        </aside>
      </div>
    </section>
  );
}
