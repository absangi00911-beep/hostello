"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { submitHostelInquiry } from "@/lib/hostel-inquiry";

interface HostelInquiryFormProps {
  hostelId: string;
  hostelName: string;
  isSignedInStudent: boolean;
}

export function HostelInquiryForm({
  hostelId,
  hostelName,
  isSignedInStudent,
}: HostelInquiryFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError("Write a message before continuing.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const outcome = await submitHostelInquiry({
        hostelId,
        hostelName,
        message: trimmedMessage,
        isSignedInStudent,
        storage: isSignedInStudent
          ? undefined
          : {
              setItem: (key, value) => window.sessionStorage.setItem(key, value),
            },
      });

      if ("error" in outcome) {
        setError(
          outcome.error === "storage"
            ? "We couldn't save your message for sign-in. Please try again."
            : "We couldn't send your message. Please try again.",
        );
        return;
      }

      router.push(outcome.destination);
    } catch {
      setError("We couldn't send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-label={`Message the host of ${hostelName}`}
      className="hostel-inquiry-form grid w-full max-w-[560px] min-w-0 gap-2.5 pt-3.5"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <label className="text-[0.84rem] font-semibold text-ink" htmlFor="hostel-inquiry-message">
        Your message
      </label>
      <textarea
        className="min-h-[112px] w-full min-w-0 resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        id="hostel-inquiry-message"
        maxLength={2_000}
        name="message"
        onChange={(event) => setMessage(event.currentTarget.value)}
        required
        rows={4}
        value={message}
      />
      {error && (
        <p className="hostel-inquiry-error m-0 text-[0.82rem] text-[#8b2525]" role="alert">
          {error}
        </p>
      )}
      <button
        className="hostel-inquiry-submit min-h-[46px] self-start rounded-lg border-0 bg-brand px-[18px] text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending…" : "Message the host"}
      </button>
    </form>
  );
}
