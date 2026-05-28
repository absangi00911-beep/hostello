// Path: src/components/auth/AuthCardLayout.tsx
import { Logo } from "@/components/Logo";
import { inputCls } from "@/components/ui/input";

interface AuthCardLayoutProps {
  heading: string;
  subheading?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCardLayout({
  heading,
  subheading,
  footer,
  children,
}: AuthCardLayoutProps) {
  return (
    <div className="min-h-dvh bg-[var(--color-bg-page)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Logo — centered above card */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Card surface — p-8 maps to --space-8 (32px) on the token scale */}
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-md)] p-8">
          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="font-heading text-[var(--text-h3)] font-[600] text-[var(--color-text-heading)] mb-1">
              {heading}
            </h1>
            {subheading && (
              <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                {subheading}
              </p>
            )}
          </div>

          {children}
        </div>

        {footer && (
          <p className="mt-5 text-center text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

/* -- Shared form field wrapper ----------------------------- */
interface FormFieldProps {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ id, label, optional, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]"
        >
          {label}
        </label>
        {optional && (
          <span className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            (optional)
          </span>
        )}
      </div>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-error)]"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

/*
 * Re-export inputCls from the canonical source (ui/input).
 * Any file that was importing inputCls from AuthCardLayout can continue to do
 * so without breaking — this re-export acts as a backwards-compatible bridge.
 */
export { inputCls };

/* -- Primary action button --------------------------------- */
export const primaryBtnCls =
  "inline-flex w-full items-center justify-center gap-2 h-11 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2";

/* -- Or divider -------------------------------------------- */
export function OrDivider() {
  return (
    <div className="relative my-5 flex items-center">
      <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
      <span className="mx-3 text-[var(--text-caption)] text-[var(--color-text-muted)] bg-[var(--color-bg-card)]">
        or
      </span>
      <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
    </div>
  );
}
