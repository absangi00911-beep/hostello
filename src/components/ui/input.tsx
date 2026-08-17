import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Canonical input class string — the single source of truth for all text inputs.
 * Import this wherever you need a raw <input> outside of the <Input> component
 * (e.g. FilterSidebar selects, AuthCardLayout).
 */
export const inputCls =
  "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3.5 text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/15 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--color-error)] aria-[invalid=true]:ring-[var(--color-error)]/12"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputCls, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
