"use client";

import { useState, type FormEvent } from "react";
import {
  AuthNotice,
  authButtonClassName,
  authInputClassName,
} from "./AuthPageShell";

const MESSAGE_MAX = 5_000;
const MESSAGE_MIN = 20;

const labelClassName =
  "grid gap-[6px] text-[0.875rem] font-semibold text-ink";

export function ContactForm({
  defaultEmail = "",
  defaultName = "",
}: {
  defaultEmail?: string;
  defaultName?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const apiMessage = (key: "error" | "message") =>
        typeof payload === "object" &&
        payload !== null &&
        typeof (payload as Record<string, unknown>)[key] === "string"
          ? ((payload as Record<string, string>)[key] as string)
          : null;

      if (!response.ok) {
        setErrorMessage(
          apiMessage("error") ??
            "We couldn't send your message. Please try again.",
        );
        return;
      }
      setSuccessMessage(
        apiMessage("message") ?? "Message sent! We'll reply within 24 hours.",
      );
      setSubject("");
      setMessage("");
    } catch {
      setErrorMessage("We couldn't send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {errorMessage ? <AuthNotice tone="error">{errorMessage}</AuthNotice> : null}
      {successMessage ? (
        <AuthNotice tone="success">{successMessage}</AuthNotice>
      ) : null}
      <form className="grid gap-[14px]" noValidate onSubmit={handleSubmit}>
        <label className={labelClassName}>
          <span>Name</span>
          <input
            autoComplete="name"
            className={authInputClassName}
            maxLength={100}
            name="name"
            onChange={(event) => setName(event.currentTarget.value)}
            required
            type="text"
            value={name}
          />
        </label>
        <label className={labelClassName}>
          <span>Email</span>
          <input
            autoComplete="email"
            className={authInputClassName}
            maxLength={254}
            name="email"
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className={labelClassName}>
          <span>Subject</span>
          <input
            className={authInputClassName}
            maxLength={200}
            name="subject"
            onChange={(event) => setSubject(event.currentTarget.value)}
            required
            type="text"
            value={subject}
          />
        </label>
        <label className={labelClassName}>
          <span>Message</span>
          <textarea
            className={`${authInputClassName} min-h-[140px] resize-y py-3`}
            maxLength={MESSAGE_MAX}
            name="message"
            onChange={(event) => setMessage(event.currentTarget.value)}
            required
            value={message}
          />
          <span className="text-[0.8125rem] font-normal text-muted">
            At least {MESSAGE_MIN} characters · {message.length}/{MESSAGE_MAX}
          </span>
        </label>
        <button
          className={authButtonClassName}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Sending…" : "Send message"}
        </button>
      </form>
    </>
  );
}
