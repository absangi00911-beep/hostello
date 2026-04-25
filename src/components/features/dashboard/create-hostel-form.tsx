"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { hostelCreateSchema, type HostelCreateInput } from "@/lib/validations";
import { CITIES, AMENITIES } from "@/config/amenities";
import { cn } from "@/lib/utils";
import { ImageUploader } from "./image-uploader";

const STEPS = [
  { id: 1, label: "Basic info" },
  { id: 2, label: "Location" },
  { id: 3, label: "Details" },
  { id: 4, label: "Amenities" },
  { id: 5, label: "Photos" },
];

const STEP_FIELDS: Record<number, (keyof HostelCreateInput)[]> = {
  1: ["name", "description"],
  2: ["city", "address"],
  3: ["pricePerMonth", "rooms", "capacity", "gender", "minStay"],
  4: ["amenities"],
  5: [],
};

const F =
  "w-full min-h-[2.5rem] px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-sm bg-white text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-700)] focus:ring-offset-1 transition-shadow";

export function CreateHostelForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HostelCreateInput>({
    resolver: zodResolver(hostelCreateSchema),
    defaultValues: { gender: "MIXED", minStay: 1, amenities: [], rules: [] },
    mode: "onTouched",
  });

  const selectedAmenities = watch("amenities") ?? [];
  const currentGender = watch("gender");

  async function goNext() {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 ? true : await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function goPrev() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function onSubmit(data: HostelCreateInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hostels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, images, coverImage: images[0] ?? null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create hostel");
      toast.success("Hostel saved as draft!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors flex-shrink-0",
                  s.id < step
                    ? "bg-[var(--color-primary-700)] border-[var(--color-primary-700)] text-white"
                    : s.id === step
                    ? "border-[var(--color-primary-700)] text-[var(--color-primary-700)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)]"
                )}
              >
                {s.id < step ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:inline",
                  s.id === step ? "text-[var(--color-text)]" : "text-[var(--color-muted)]"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-3 transition-colors",
                  s.id < step ? "bg-[var(--color-primary-700)]" : "bg-[var(--color-border)]"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 sm:p-8">
        {/* noValidate + no onSubmit — submission is triggered only by the explicit button on step 5 */}
        <form noValidate>

          {/* Step 1 — Basic info */}
          {step === 1 && (
            <div className="space-y-5">
              <SectionHeader title="Tell us about your hostel" subtitle="Students will see this first — make it accurate." />
              <Field label="Hostel name" error={errors.name?.message} required>
                <input {...register("name")} placeholder="e.g. Green Valley Boys Hostel" className={F} />
              </Field>
              <Field label="Description" error={errors.description?.message} required>
                <textarea
                  {...register("description")}
                  rows={5}
                  placeholder="Describe the hostel — proximity to universities, atmosphere, what makes it stand out. Min. 50 characters."
                  className={cn(F, "resize-none")}
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">Be honest. Students make decisions based on this.</p>
              </Field>
            </div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <div className="space-y-5">
              <SectionHeader title="Where is it?" subtitle="Accurate location helps students find hostels near their university." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="City" error={errors.city?.message} required>
                  <select {...register("city")} className={cn(F, "appearance-none cursor-pointer")}>
                    <option value="">Select city</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Area / Neighbourhood">
                  <input {...register("area")} placeholder="e.g. Gulberg III" className={F} />
                </Field>
              </div>
              <Field label="Full address" error={errors.address?.message} required>
                <input {...register("address")} placeholder="House / plot number, street, area, city" className={F} />
              </Field>
            </div>
          )}

          {/* Step 3 — Details */}
          {step === 3 && (
            <div className="space-y-5">
              <SectionHeader title="Capacity & pricing" subtitle="These appear directly on the listing." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Monthly rent (PKR)" error={errors.pricePerMonth?.message} required>
                  <input {...register("pricePerMonth", { valueAsNumber: true })} type="number" min={1000} placeholder="8500" className={F} />
                </Field>
                <Field label="Number of rooms" error={errors.rooms?.message} required>
                  <input {...register("rooms", { valueAsNumber: true })} type="number" min={1} placeholder="20" className={F} />
                </Field>
                <Field label="Total capacity (beds)" error={errors.capacity?.message} required>
                  <input {...register("capacity", { valueAsNumber: true })} type="number" min={1} placeholder="40" className={F} />
                </Field>
                <Field label="Minimum stay (months)" error={errors.minStay?.message} required>
                  <input {...register("minStay", { valueAsNumber: true })} type="number" min={1} placeholder="1" className={F} />
                </Field>
              </div>

              <Field label="Who can stay?" error={errors.gender?.message} required>
                <div className="flex gap-3">
                  {(["MALE", "FEMALE", "MIXED"] as const).map((g) => {
                    const labels = { MALE: "Boys only", FEMALE: "Girls only", MIXED: "Mixed" };
                    return (
                      <label key={g} className="flex-1 cursor-pointer">
                        <input type="radio" {...register("gender")} value={g} className="sr-only" />
                        <div
                          className={cn(
                            "py-2.5 rounded-xl border text-sm font-medium text-center transition-colors",
                            currentGender === g
                              ? "border-[var(--color-primary-700)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                              : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-sand-400)]"
                          )}
                        >
                          {labels[g]}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </Field>

              <Field label="House rules">
                <textarea
                  rows={3}
                  placeholder={"One rule per line, e.g.:\nNo guests after 10pm\nNo smoking indoors"}
                  className={cn(F, "resize-none")}
                  onChange={(e) => setValue("rules", e.target.value.split("\n").filter(Boolean))}
                />
              </Field>
            </div>
          )}

          {/* Step 4 — Amenities */}
          {step === 4 && (
            <div className="space-y-5">
              <SectionHeader title="What do you offer?" subtitle="Select everything included in the monthly rent." />
              {errors.amenities && (
                <p className="text-xs text-red-600">{errors.amenities.message as string}</p>
              )}
              <Controller
                name="amenities"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {AMENITIES.map((amenity) => {
                      const checked = field.value?.includes(amenity.id);
                      return (
                        <label
                          key={amenity.id}
                          className={cn(
                            "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors",
                            checked
                              ? "border-[var(--color-primary-700)] bg-[var(--color-primary-50)]"
                              : "border-[var(--color-border)] hover:border-[var(--color-sand-400)] bg-white"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const updated = checked
                                ? field.value.filter((a: string) => a !== amenity.id)
                                : [...(field.value ?? []), amenity.id];
                              field.onChange(updated);
                            }}
                            className="sr-only"
                          />
                          <span className="text-lg">{amenity.emoji}</span>
                          <span className={cn("text-sm font-medium", checked ? "text-[var(--color-primary-700)]" : "text-[var(--color-text)]")}>
                            {amenity.label}
                          </span>
                          {checked && <Check className="w-3.5 h-3.5 text-[var(--color-primary-700)] ml-auto flex-shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              <p className="text-xs text-[var(--color-muted)]">{selectedAmenities.length} selected</p>
            </div>
          )}

          {/* Step 5 — Photos */}
          {step === 5 && (
            <div className="space-y-5">
              <SectionHeader
                title="Add photos"
                subtitle="The first photo becomes the cover image. At least one is required to publish."
              />
              <ImageUploader images={images} onChange={setImages} />
              {images.length === 0 && (
                <p className="text-xs text-[var(--color-muted)] bg-[var(--color-sand-50)] border border-[var(--color-border)] rounded-xl px-4 py-3">
                  You can save as a draft now and add photos before submitting for review.
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-sand-50)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(onSubmit)()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent-500)] text-white text-sm font-semibold hover:bg-[var(--color-accent-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Saving…" : "Save listing"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h2>
      <p className="text-sm text-[var(--color-muted)] mt-0.5">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
