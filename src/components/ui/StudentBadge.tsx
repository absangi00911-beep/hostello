import { ShieldCheck } from "lucide-react";

interface Props {
  size?: "sm" | "md";
  className?: string;
}

export function StudentBadge({ size = "sm", className = "" }: Props) {
  const isMd = size === "md";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-[500]
        border-[var(--color-primary-light)] bg-[var(--color-primary-faint)]
        text-[var(--color-primary-deep)]
        ${isMd ? "h-6 px-2.5 text-[12px]" : "h-5 px-2 text-[11px]"}
        ${className}`}
      aria-label="Verified student"
      title="Verified student"
    >
      <ShieldCheck
        size={isMd ? 13 : 11}
        strokeWidth={2}
        aria-hidden="true"
      />
      Verified student
    </span>
  );
}
