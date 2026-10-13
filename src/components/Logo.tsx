import Link from "next/link"
import { cn } from "@/lib/utils"

type LogoSize = "standard" | "compact"

const sizeConfig: Record<LogoSize, { dim: number; textCls: string }> = {
  standard: {
    dim: 34,
    textCls: "text-[1.125rem] font-[700] tracking-[-0.055em]",
  },
  compact: {
    dim: 28,
    textCls: "text-[0.9375rem] font-[700] tracking-[-0.055em]",
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
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect x="1.5" y="1.5" width="33" height="33" rx="11" fill="var(--color-primary)" />
        <path
          d="M9.5 25V13.4L18 7.3l8.5 6.1V25h-6v-8h-5v8h-6Z"
          fill="var(--color-text-inverse)"
          fillRule="evenodd"
        />
        <circle cx="18" cy="13" r="1.45" fill="var(--color-primary-light)" />
      </svg>

      <span
        className={cn(
          textCls,
          "inline-flex items-baseline font-heading text-[color:var(--color-text-heading)] leading-none select-none"
        )}
      >
        <span>Hostel</span>
        <span className="font-display font-[500] italic tracking-[-0.075em] text-[color:var(--color-primary-deep)]">
          Lo
        </span>
      </span>
    </Link>
  )
}
