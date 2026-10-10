// Path: src/components/auth/AuthCardLayout.tsx
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/card";
import { inputCls } from "@/components/ui/input";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PhotoImage } from "@/components/landing/PhotoImage";

const AUTH_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80&auto=format&fit=crop";

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
    <main id="main-content" className="auth-editorial-shell min-h-dvh bg-[var(--color-bg-page)] px-4 py-8 sm:px-6 lg:flex lg:items-center lg:justify-center lg:py-12">
      <div className="auth-editorial-grid grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
        <aside className="auth-editorial-art relative hidden min-h-[600px] overflow-hidden bg-[var(--color-text-heading)] lg:flex">
          <PhotoImage
            dark
            src={AUTH_IMAGE}
            alt="Students walking together across a university campus"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" aria-hidden="true" />
          <div className="auth-art-topline absolute inset-x-8 top-8 flex justify-between text-white/75">
            <span>HOSTELLO FIELD GUIDE</span>
            <span>PAKISTAN · 01</span>
          </div>
          <div className="auth-art-copy relative mt-auto p-10">
            <p className="auth-art-kicker">
              {heading === "Sign in" ? "YOUR NEXT CHAPTER" : "A PLACE TO BEGIN"}
            </p>
            <p className="auth-art-title mt-3 max-w-md text-white">
              Your next room is closer than you think.
            </p>
            <div className="auth-art-note mt-6 flex items-center gap-2 text-white/80">
              <ShieldCheck size={16} strokeWidth={1.6} aria-hidden="true" />
              Thoughtful stays, verified listings, clear monthly prices
              <ArrowRight size={14} strokeWidth={1.6} aria-hidden="true" />
            </div>
          </div>
        </aside>

        <div className="auth-editorial-form w-full max-w-[440px] justify-self-center">
          <div className="mb-7 flex justify-center lg:justify-start">
            <Logo />
          </div>

          <Card className="auth-editorial-card p-6 shadow-[var(--shadow-md)] sm:p-8">
            {/* Heading */}
            <div className="mb-7 text-center">
              <h1 className="auth-editorial-heading mb-1 text-[length:var(--text-h3)] text-[color:var(--color-text-heading)]">
                {heading}
              </h1>
              {subheading && (
                <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                  {subheading}
                </p>
              )}
            </div>

            {children}
          </Card>

          {footer && (
            <p className="auth-editorial-footer mt-5 text-center text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] lg:text-left">
              {footer}
            </p>
          )}
        </div>
      </div>
    </main>
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
          className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]"
        >
          {label}
        </label>
        {optional && (
          <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            (optional)
          </span>
        )}
      </div>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-[length:var(--text-body-sm)] text-[color:var(--color-error)]"
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
  "inline-flex w-full items-center justify-center gap-2 h-11 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-action)] focus-visible:outline-offset-2";

/* -- Or divider -------------------------------------------- */
export function OrDivider() {
  return (
    <div className="relative my-5 flex items-center">
      <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
      <span className="mx-3 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] bg-[var(--color-bg-card)]">
        or
      </span>
      <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
    </div>
  );
}
