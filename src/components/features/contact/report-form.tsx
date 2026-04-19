"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

const schema = z.object({
  type: z.enum(["listing", "review", "payment", "safety", "other"]),
  description: z.string().min(20, "Please describe the issue in at least 20 characters"),
  url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});
type Input = z.infer<typeof schema>;

const ISSUE_TYPES = [
  { value: "listing",  label: "Inaccurate or misleading listing" },
  { value: "review",   label: "Fake or inappropriate review" },
  { value: "payment",  label: "Payment or refund problem" },
  { value: "safety",   label: "Safety concern" },
  { value: "other",    label: "Something else" },
];

const INPUT =
  "w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-700)] focus:ring-offset-1";

export function ReportForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input>({
    resolver: zodResolver(schema),
    defaultValues: { type: "listing" },
  });

  async function onSubmit(_data: Input) {
    await new Promise((r) => setTimeout(r, 700));
    setSent(true);
    toast.success("Report submitted. We review all reports within 48 hours.");
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-10 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h2
          className="text-lg font-bold text-[var(--color-text)] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Report received
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          Thank you. We'll investigate and take action within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-7">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Issue type</label>
          <select
            {...register("type")}
            className={`${INPUT} appearance-none cursor-pointer`}
          >
            {ISSUE_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe what you found and why it's a problem."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--color-primary-700)] focus:ring-offset-1"
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
            Page URL <span className="text-[var(--color-muted)] font-normal">(optional)</span>
          </label>
          <input {...register("url")} type="url" placeholder="https://hostello.pk/hostels/..." className={INPUT} />
          {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
            Your email <span className="text-[var(--color-muted)] font-normal">(for follow-up)</span>
          </label>
          <input {...register("email")} type="email" placeholder="you@example.com" className={INPUT} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
