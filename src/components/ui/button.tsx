"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — shared across all variants
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-[500] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Green CTA — the primary action on any screen. Use once per screen max.
        default:
          "bg-[var(--color-action)] text-[var(--color-text-inverse)] rounded-[var(--radius-md)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] focus-visible:outline-[var(--color-action-light)] shadow-[var(--shadow-xs)]",
        // Subtle secondary — supporting actions alongside a primary
        secondary:
          "bg-[var(--color-bg-sidebar)] text-[var(--color-text-body)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] hover:bg-[var(--color-bg-overlay)] hover:border-[var(--color-border-strong)] active:scale-[0.97] focus-visible:outline-[var(--color-primary)]",
        // Tertiary / "Secondary" per design spec — transparent, 2px Deep Navy border + text
        outline:
          "bg-transparent text-[var(--color-secondary-brand)] border-2 border-[var(--color-secondary-brand)] rounded-[var(--radius-md)] hover:bg-[var(--color-secondary-brand)]/8 active:scale-[0.97] focus-visible:outline-[var(--color-primary)]",
        // Ghost — icon buttons, nav links. Spec: "Deep Navy text, no background"
        ghost:
          "bg-transparent text-[var(--color-secondary-brand)] rounded-[var(--radius-md)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-heading)] focus-visible:outline-[var(--color-primary)]",
        // Destructive — irreversible actions only (delete, cancel)
        destructive:
          "bg-[var(--color-error)] text-[var(--color-text-inverse)] rounded-[var(--radius-md)] hover:bg-[oklch(0.45_0.16_22)] active:bg-[oklch(0.40_0.15_22)] active:scale-[0.97] focus-visible:outline-[var(--color-error)] shadow-[var(--shadow-xs)]",
        // Inline text link
        link:
          "bg-transparent text-[var(--color-text-link)] underline-offset-4 hover:underline focus-visible:outline-[var(--color-primary)] p-0 h-auto",
      },
      size: {
        default: "h-10 px-6 text-[var(--text-body-sm)] [&_svg]:size-4",
        sm:      "h-8  px-3 text-[var(--text-caption)]  [&_svg]:size-3.5",
        lg:      "h-11 px-6 text-[var(--text-body)]      [&_svg]:size-4",
        icon:    "h-9  w-9                                [&_svg]:size-4",
        "icon-sm":"h-8  w-8                               [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Show a spinner and disable the button while loading */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading ? "true" : undefined}
        {...props}
      >
        {asChild ? (
          // Slot requires exactly one element child — no extra siblings,
          // even falsy ones. The consumer's own child renders as-is.
          children
        ) : (
          <>
            {loading && (
              <Loader2
                className="animate-spin"
                aria-hidden="true"
              />
            )}
            {children}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
