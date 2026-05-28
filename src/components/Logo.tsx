import Link from "next/link"
import { cn } from "@/lib/utils"

type LogoSize = "standard" | "compact"

const sizeConfig: Record<LogoSize, { dim: number; textCls: string }> = {
  standard: {
    dim: 28,
    textCls: "text-[1.125rem] font-[700] tracking-[-0.02em]",
  },
  compact: {
    dim: 22,
    textCls: "text-[0.9375rem] font-[700] tracking-[-0.02em]",
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
        "flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 rounded-sm",
        className
      )}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect
          x="2" y="8" width="16" height="18" rx="2"
          fill="currentColor"
          className="text-[var(--color-primary)]"
        />
        <rect
          x="10" y="2" width="16" height="18" rx="2"
          fill="currentColor"
          className="text-[var(--color-primary-deep)]"
          opacity="0.7"
        />
        <rect
          x="6" y="16" width="4" height="6" rx="1"
          fill="var(--color-bg-card)"
        />
      </svg>

      <span
        className={cn(
          textCls,
          "font-heading text-[var(--color-text-heading)] leading-none select-none"
        )}
      >
        HostelLo
      </span>
    </Link>
  )
}
