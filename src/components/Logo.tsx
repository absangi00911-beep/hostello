import Link from "next/link"
import { cn } from "@/lib/utils"

type LogoSize = "standard" | "compact"

const sizeConfig: Record<LogoSize, { dim: number; textCls: string }> = {
  standard: {
    dim: 30,
    textCls: "text-[1.125rem] font-[700] tracking-[-0.05em]",
  },
  compact: {
    dim: 24,
    textCls: "text-[0.9375rem] font-[700] tracking-[-0.05em]",
  },
}

interface LogoProps {
  size?: LogoSize
  /** Override the href — defaults to "/" */
  href?: string
  className?: string
}

/**
 * HostelLo logo — single source of truth.
 *
 * Usage:
 *   <Logo />                   ← standard (28px, navbar / auth)
 *   <Logo size="compact" />    ← compact  (22px, sidebar layouts)
 */
export function Logo({ size = "standard", href = "/", className }: LogoProps) {
  const { dim, textCls } = sizeConfig[size]

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2",
        className
      )}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="hostello-mark" x1="5" x2="27" y1="4" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-primary-deep)" />
          </linearGradient>
        </defs>

        <rect x="2.5" y="2.5" width="27" height="27" rx="9" fill="url(#hostello-mark)" />

        <path
          d="M9.2 22.2V11.2H12.8V14.8H19.2V11.2H22.8V22.2H19.2V18.2H12.8V22.2H9.2Z"
          fill="white"
        />

        <path
          d="M8.2 11.4L15.9 7.1L23.8 11.4"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M12.5 14.8H19.5"
          stroke="rgba(255,255,255,0.88)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <span
        className={cn(
          textCls,
          "font-heading text-[color:var(--color-text-heading)] leading-none select-none"
        )}
      >
        HostelLo
      </span>
    </Link>
  )
}
