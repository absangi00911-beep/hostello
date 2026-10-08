"use client"

// Path: src/components/ui/button.tsx

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
        // Primary CTA — the main action on a screen. Use once per screen max.
        default:
          "bg-[var(--color-action)] text-[color:var(--color-text-inverse)] rounded-[var(--radius-md)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] focus-visible:outline-[var(--color-action)] shadow-[var(--shadow-xs)]",
        // Subtle secondary — supporting actions alongside a primary
        secondary:
          "bg-[var(--color-bg-sidebar)] text-[color:var(--color-text-body)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] hover:bg-[var(--color-bg-overlay)] hover:border-[var(--color-border-strong)] active:scale-[0.97] focus-visible:outline-[var(--color-primary)]",
        // Outline — neutral 1px border, for a secondary action next to a primary CTA
        outline:
          "bg-transparent text-[color:var(--color-text-heading)] border border-[var(--color-border-strong)] rounded-[var(--radius-md)] hover:bg-[var(--color-bg-sidebar)] active:scale-[0.97] focus-visible:outline-[var(--color-primary)]",
        // Ghost — icon buttons, nav links: text only, no background or border
        ghost:
          "bg-transparent text-[color:var(--color-text-body)] rounded-[var(--radius-md)] hover:bg-[var(--color-bg-overlay)] hover:text-[color:var(--color-text-heading)] focus-visible:outline-[var(--color-primary)]",
        // Destructive — irreversible actions only (delete, cancel)
        destructive:
          "bg-[var(--color-error)] text-[color:var(--color-text-inverse)] rounded-[var(--radius-md)] hover:opacity-90 active:opacity-80 active:scale-[0.97] focus-visible:outline-[var(--color-error)] shadow-[var(--shadow-xs)]",
        // Inline text link
        link:
          "bg-transparent text-[color:var(--color-text-link)] underline-offset-4 hover:underline focus-visible:outline-[var(--color-primary)] p-0 h-auto",
      },
      size: {
        default: "h-10 px-6 text-[length:var(--text-body-sm)] [&_svg]:size-4",
        sm:      "h-8  px-3 text-[length:var(--text-caption)]  [&_svg]:size-3.5",
        lg:      "h-11 px-6 text-[length:var(--text-body)]      [&_svg]:size-4",
        icon:    "h-9  w-9                                [&_svg]:size-4",
        "icon-sm":"h-8  w-8                               [&_svg]:size-3.5",
      },
      // "default" keeps each variant's own radius-md; "pill" is fully
      // rounded, for search-adjacent triggers and nav chips (Day 4/6).
      shape: {
        default: "",
        pill: "rounded-[var(--radius-full)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
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
  ({ className, variant, size, shape, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
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
