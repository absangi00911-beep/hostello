"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { FORM_INPUT } from "@/lib/form-constants";

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      error,
      label,
      helperText,
      required,
      icon,
      className,
      disabled,
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
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              FORM_INPUT,
              error && "border-red-500 focus:ring-red-500",
              disabled && "bg-[var(--color-ground)] cursor-not-allowed opacity-60",
              icon && "pl-10",
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]">
              {icon}
            </div>
          )}
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

FormInput.displayName = "FormInput";
