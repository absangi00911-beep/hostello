// Path: src/components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Generic badge for tags, chips, and labels — "New", "Guest favorite",
 * amenity/category chips. For booking/payment/verification status values,
 * use StatusBadge in shared.tsx instead; that one carries the fixed status
 * vocabulary and success/warning/error tone mapping this one doesn't.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2.5 h-6 text-[11px] font-[600] w-fit whitespace-nowrap shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-bg-sidebar)] text-[color:var(--color-text-body)] border border-[var(--color-border-default)]",
        primary:
          "bg-[var(--color-primary-faint)] text-[color:var(--color-primary-deep)] border border-[var(--color-primary-light)]",
        outline:
          "bg-transparent text-[color:var(--color-text-body)] border border-[var(--color-border-strong)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }