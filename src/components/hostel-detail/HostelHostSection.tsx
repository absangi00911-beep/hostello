import Image from "next/image";
import { HostelInquiryForm } from "@/components/hostel-detail/HostelInquiryForm";

type HostResponseSummary = {
  guestStartedThreadCount: number;
  repliedThreadCount: number;
  medianResponseSeconds: number | null;
};

interface HostelHostSectionProps {
  hostelId: string;
  hostelName: string;
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
      <div className="hostel-host-profile">
        {host.avatar ? (
          <Image
            alt={host.name}
            className="hostel-host-avatar"
            height={72}
            src={host.avatar}
            unoptimized
            width={72}
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
          <p>Member since {membershipDate}</p>
          {host.city && <p>Based in {host.city}</p>}
        </div>
      </div>

      {host.bio && <p className="hostel-host-bio">{host.bio}</p>}

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
        <HostelInquiryForm
          hostelId={hostelId}
          hostelName={hostelName}
          isSignedInStudent={viewerRole === "STUDENT"}
        />
      )}
    </section>
  );
}
