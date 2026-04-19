"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MessageSquare, CheckCircle2 } from "lucide-react";

const schema = z.object({
  name:    z.string().min(2, "Enter your name"),
  email:   z.string().email("Enter a valid email"),
  subject: z.string().min(5, "Enter a subject"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});
type Input = z.infer<typeof schema>;

const INPUT =
  "w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-700)] focus:ring-offset-1";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input>({ resolver: zodResolver(schema) });

  async function onSubmit(_data: Input) {
    // In production: POST to /api/contact → Resend email
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    toast.success("Message sent! We'll reply within 24 hours.");
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h2
          className="text-xl font-bold text-[var(--color-text)] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Message received
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          We'll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-7">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Name</label>
            <input {...register("name")} placeholder="Ali Raza" className={INPUT} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Email</label>
            <input {...register("email")} type="email" placeholder="ali@example.com" className={INPUT} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Subject</label>
          <input {...register("subject")} placeholder="e.g. Issue with my booking" className={INPUT} />
          {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Message</label>
          <textarea
            {...register("message")}
            rows={5}
            placeholder="Describe your issue or question in detail."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--color-primary-700)] focus:ring-offset-1"
          />
          {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          {isSubmitting ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
