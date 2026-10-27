"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { X } from "lucide-react";

function getResponseMessage(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }
  return null;
}

function isVerificationGrant(value: unknown): value is { grant: string; needsName: boolean } {
  return (
    typeof value === "object" &&
    value !== null &&
    "grant" in value &&
    typeof value.grant === "string" &&
    "needsName" in value &&
    typeof value.needsName === "boolean"
  );
}

function getAuthErrorMessage(error?: string): string | null {
  if (!error) return null;
  if (error === "OAuthAccountNotLinked") {
    return "This email is already linked to an account. Enter it to receive a login code.";
  }
  if (error === "expired-token") {
    return "That verification link has expired. Request a new one to continue.";
  }
  if (error === "invalid-token") {
    return "That verification link is invalid. Request a new one to continue.";
  }
  if (error === "server-error") {
    return "We couldn't verify your email just now. Please try again.";
  }
  return "We couldn't log you in. Check your details and try again.";
}

export default function LoginDialog({
  callbackUrl,
  error,
  googleEnabled,
  onClose,
  open = true,
  verified,
}: {
  callbackUrl: string;
  error?: string;
  googleEnabled: boolean;
  onClose?: () => void;
  open?: boolean;
  verified: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState("");
  const [grant, setGrant] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "name">("email");
  const [errorMessage, setErrorMessage] = useState(
    getAuthErrorMessage(error),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);

  function handleOpenChange(open: boolean) {
    if (!open) {
      if (onClose) {
        onClose();
      } else {
        router.replace("/");
      }
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setIsGoogleRedirecting(true);
    try {
      await signIn("google", { redirectTo: callbackUrl });
    } catch {
      setErrorMessage("Google sign-in is temporarily unavailable. Please try again.");
      setIsGoogleRedirecting(false);
    }
  }

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = email.trim();

    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setErrorMessage("Enter a valid email address to continue.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        setErrorMessage(
          getResponseMessage(result) ??
            "We couldn't send a code just now. Please try again.",
        );
        return;
      }

      setEmail(nextEmail.toLowerCase());
      setStep("otp");
      setOtpCode("");
      setStatusMessage(
        "If this email can receive sign-in codes, a code has been sent.",
      );
    } catch {
      setErrorMessage("We couldn't send a code just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeLogin(verificationGrant: string, displayName?: string) {
    const result = await signIn("email-otp", {
      email,
      grant: verificationGrant,
      ...(displayName ? { name: displayName.trim() } : {}),
      redirect: false,
      redirectTo: callbackUrl,
    });

    if (result?.error || !result?.ok) {
      setErrorMessage(
        "That code could not be used. Request a new code and try again.",
      );
      return;
    }

    onClose?.();
    router.replace(callbackUrl);
    router.refresh();
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = otpCode.replace(/\D/g, "").slice(0, 6);

    if (cleaned.length !== 6) {
      setErrorMessage("Enter the 6-digit code sent to your email.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code: cleaned }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        setErrorMessage(
          getResponseMessage(result) ??
            "That code is invalid or has expired. Request a new one.",
        );
        return;
      }

      if (!isVerificationGrant(result)) {
        setErrorMessage("We couldn't verify your email just now. Please try again.");
        return;
      }

      setGrant(result.grant);
      if (result.needsName) {
        setStep("name");
        return;
      }

      await completeLogin(result.grant);
    } catch {
      setErrorMessage("We couldn't verify your email just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = name.trim();
    if (displayName.length < 2 || displayName.length > 80) {
      setErrorMessage("Enter a name between 2 and 80 characters.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await completeLogin(grant, displayName);
    } catch {
      setErrorMessage("We couldn't create your account just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        setErrorMessage(
          getResponseMessage(result) ??
            "We couldn't resend the code just now. Please try again.",
        );
        return;
      }
      setOtpCode("");
      setStatusMessage("If this email can receive sign-in codes, a new code has been sent.");
    } catch {
      setErrorMessage("We couldn't resend the code just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="login-dialog-overlay" />
        <Dialog.Content
          aria-describedby="login-dialog-description"
          className="login-dialog-content"
        >
          <Dialog.Close asChild>
            <button
              aria-label="Close login dialog"
              className="login-dialog-close"
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </Dialog.Close>

          <div className="login-dialog-brand" aria-hidden="true">
            H
          </div>
          <Dialog.Title className="login-dialog-title">
            {step === "email"
              ? "Log in to HostelLo"
              : step === "otp"
                ? "Verify your email"
                : "Create your account"}
          </Dialog.Title>

          <Dialog.Description
            className="login-dialog-description"
            id="login-dialog-description"
          >
            {step === "email"
              ? "Enter your email to receive a one-time login code."
              : step === "otp"
                ? `Enter the 6-digit code sent to ${email || "your email"}.`
                : "Choose the name people will see on your HostelLo profile."}
          </Dialog.Description>

          {verified && (
            <p className="login-dialog-feedback" role="status">
              Your email has been verified. Log in to continue.
            </p>
          )}
          {errorMessage && (
            <p className="login-dialog-feedback login-dialog-feedback-error" role="alert">
              {errorMessage}
            </p>
          )}
          {statusMessage && (
            <p className="login-dialog-feedback" role="status">
              {statusMessage}
            </p>
          )}

          {step === "email" ? (
            <form className="login-dialog-form" noValidate onSubmit={requestOtp}>
              <label className="login-dialog-field">
                <span>Email</span>
                <input
                  autoComplete="email"
                  autoFocus
                  name="email"
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>

              <button
                className="login-dialog-submit"
                disabled={isSubmitting || isGoogleRedirecting}
                type="submit"
              >
                {isSubmitting ? "Sending code…" : "Continue"}
              </button>
            </form>
          ) : step === "otp" ? (
            <form className="login-dialog-form" onSubmit={verifyOtp}>
              <label className="login-dialog-field">
                <span>6-digit code</span>
                <input
                  autoComplete="one-time-code"
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  name="otp"
                  onChange={(event) =>
                    setOtpCode(
                      event.currentTarget.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  pattern="[0-9]*"
                  placeholder="123456"
                  type="text"
                  value={otpCode}
                />
              </label>

              <button
                className="login-dialog-submit"
                disabled={isSubmitting || isGoogleRedirecting}
                type="submit"
              >
                {isSubmitting ? "Verifying…" : "Continue"}
              </button>

              <div className="login-dialog-inline-actions">
                <button
                  className="login-dialog-text-button"
                  onClick={() => setStep("email")}
                  type="button"
                >
                  Use another email
                </button>
                <button
                  className="login-dialog-text-button"
                  onClick={handleResendCode}
                  disabled={isSubmitting || isGoogleRedirecting}
                  type="button"
                >
                  Resend code
                </button>
              </div>
            </form>
          ) : (
            <form className="login-dialog-form" onSubmit={createAccount}>
              <label className="login-dialog-field">
                <span>Name</span>
                <input
                  autoComplete="name"
                  autoFocus
                  maxLength={80}
                  minLength={2}
                  name="name"
                  onChange={(event) => setName(event.currentTarget.value)}
                  required
                  type="text"
                  value={name}
                />
              </label>

              <button
                className="login-dialog-submit"
                disabled={isSubmitting || isGoogleRedirecting}
                type="submit"
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          {googleEnabled && step === "email" && (
            <>
              <div className="login-dialog-divider" aria-hidden="true">
                <span />
                <span>or</span>
                <span />
              </div>
              <button
                className="login-dialog-google"
                disabled={isSubmitting || isGoogleRedirecting}
                onClick={() => void handleGoogleSignIn()}
                type="button"
              >
                {isGoogleRedirecting
                  ? "Connecting to Google…"
                  : "Continue with Google"}
              </button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
