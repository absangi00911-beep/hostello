"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { FORM_SELECT } from "@/lib/form-constants";
import { ChevronDown } from "lucide-react";

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      error,
      label,
      helperText,
      required,
      options,
      placeholder,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-ink)]">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              FORM_SELECT,
              "appearance-none pr-10",
              error && "border-red-500 focus:ring-red-500",
              disabled && "bg-[var(--color-ground)] cursor-not-allowed opacity-60",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-muted)] pointer-events-none" />
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-xs text-[var(--color-ink-muted)]">{helperText}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";
