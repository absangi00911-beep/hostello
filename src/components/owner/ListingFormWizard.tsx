// Path: src/components/owner/ListingFormWizard.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Upload,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { CITIES, AMENITIES } from "@hostello/shared";
import { inputCls } from "@/components/auth/AuthCardLayout";

/* -- Types ------------------------------------------------- */
export interface ListingFormData {
  name: string;
  description: string;
  city: string;
  area: string;
  address: string;
  gender: "MALE" | "FEMALE" | "MIXED";
  pricePerMonth: number | "";
  rooms: number | "";
  capacity: number | "";
  minStay: number | "";
  maxStay: number | "";
  latitude: number | "";
  longitude: number | "";
  amenities: string[];
  images: string[];
  coverImage: string;
  rules: string[];
}

const DEFAULT_FORM: ListingFormData = {
  name: "", description: "", city: "", area: "", address: "",
  gender: "MIXED",
  pricePerMonth: "", rooms: "", capacity: "", minStay: 1, maxStay: "",
  latitude: "", longitude: "",
  amenities: [], images: [], coverImage: "", rules: [],
};

const AMENITY_PRESETS = AMENITIES.map((a) => a.label);

/* -- Step indicator ---------------------------------------- */
const STEPS = ["Basic info","Location","Amenities","Photos","Rules","Review"];

function StepProgress({ step }: { step: number }) {
  const pct = Math.round((step / STEPS.length) * 100);
  return (
    <div className="mb-8">
      <div className="h-1 w-full rounded-full bg-[var(--color-border-subtle)] mb-3">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-[var(--transition-slow)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
        Step {step} of {STEPS.length} —{" "}
        <span className="font-[500] text-[var(--color-text-body)]">{STEPS[step - 1]}</span>
      </p>
    </div>
  );
}

/* -- Tag input --------------------------------------------- */
function TagInput({
  label, values, onChange, placeholder, presets,
}: {
  label: string; values: string[]; onChange: (v: string[]) => void;
  placeholder?: string; presets?: string[];
}) {
  const [input, setInput] = useState("");
  function add(val: string) {
    const trimmed = val.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput("");
  }
  function remove(val: string) { onChange(values.filter((v) => v !== val)); }

  return (
    <div className="space-y-2">
      <label className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">{label}</label>
      {presets && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p} type="button"
              onClick={() => values.includes(p) ? remove(p) : add(p)}
              className={`h-7 px-2.5 rounded-full text-[var(--text-caption)] font-[500] border transition-colors duration-[var(--transition-fast)] ${
                values.includes(p)
                  ? "bg-[var(--color-primary-faint)] border-[var(--color-primary-light)] text-[var(--color-primary-deep)]"
                  : "bg-[var(--color-bg-sidebar)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              {values.includes(p) ? "✓ " : ""}{p}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
          placeholder={placeholder ?? "Type and press Enter"}
          className={inputCls}
        />
        <button
          type="button" onClick={() => add(input)}
          disabled={!input.trim()}
          className="h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors disabled:opacity-40"
        >
          <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-[var(--color-bg-sidebar)] border border-[var(--color-border-subtle)] text-[var(--text-caption)] text-[var(--color-text-body)]">
              {v}
              <button type="button" onClick={() => remove(v)} aria-label={`Remove ${v}`}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--color-border-default)] transition-colors">
                <X size={10} strokeWidth={2} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* -- Photo uploader ---------------------------------------- */
function PhotoUploader({
  images, coverImage, onChange, onCoverChange, hostelId,
}: {
  images: string[]; coverImage: string;
  onChange: (imgs: string[]) => void;
  onCoverChange: (url: string) => void;
  hostelId?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    if (images.length + files.length > 15) {
      toast.error("Maximum 15 photos allowed.");
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
        toast.error(`${file.name} is not a supported format. Use JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB limit.`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      if (hostelId) fd.append("hostelId", hostelId);
      try {
        const res  = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Upload failed."); continue; }
        newUrls.push(json.url);
      } catch { toast.error("Upload failed. Check your connection."); }
    }
    if (newUrls.length) {
      const updated = [...images, ...newUrls];
      onChange(updated);
      if (!coverImage && updated.length) onCoverChange(updated[0]);
    }
    setUploading(false);
  }

  function removeImage(url: string) {
    const updated = images.filter((i) => i !== url);
    onChange(updated);
    if (coverImage === url) onCoverChange(updated[0] ?? "");
  }

  return (
    <div className="space-y-4">
      <label className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">
        Photos <span className="text-[var(--color-text-muted)] font-[400]">(max 15, 5MB each)</span>
      </label>

      {/* Upload zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || images.length >= 15}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)] py-10 transition-colors duration-[var(--transition-fast)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-faint)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-[var(--color-primary)]" aria-hidden="true" />
        ) : (
          <Upload size={24} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
        )}
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          {uploading ? "Uploading…" : "Click to upload photos"}
        </p>
        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">JPEG, PNG, WebP</p>
      </button>
      <input
        ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        multiple className="sr-only"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-overlay)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              {/* Cover badge */}
              {url === coverImage && (
                <span className="absolute left-1 top-1 rounded-sm bg-[var(--color-primary)] px-1 text-[9px] font-[700] text-[var(--color-text-heading)] leading-4">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-[var(--transition-fast)] flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {url !== coverImage && (
                  <button
                    type="button" onClick={() => onCoverChange(url)}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-[600] text-gray-800"
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button" onClick={() => removeImage(url)}
                  aria-label="Remove photo"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600"
                >
                  <X size={12} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -- Main wizard ------------------------------------------- */
interface ListingFormWizardProps {
  initialData?: Partial<ListingFormData>;
  hostelId?: string;  // present on edit
  mode: "create" | "edit";
}

export function ListingFormWizard({ initialData, hostelId, mode }: ListingFormWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingFormData>({ ...DEFAULT_FORM, ...initialData });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function next() { setStep((s) => Math.min(s + 1, STEPS.length)); }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        name:          form.name.trim(),
        description:   form.description.trim(),
        city:          form.city,
        area:          form.area || undefined,
        address:       form.address.trim(),
        gender:        form.gender,
        pricePerMonth: Number(form.pricePerMonth),
        rooms:         Number(form.rooms),
        capacity:      Number(form.capacity),
        minStay:       Number(form.minStay) || 1,
        maxStay:       form.maxStay ? Number(form.maxStay) : undefined,
        latitude:      form.latitude ? Number(form.latitude) : undefined,
        longitude:     form.longitude ? Number(form.longitude) : undefined,
        amenities:     form.amenities,
        images:        form.images,
        coverImage:    form.coverImage || form.images[0] || undefined,
        rules:         form.rules,
        status:        "PENDING_REVIEW" as const,
      };

      const url    = mode === "edit" ? `/api/hostels/${hostelId}` : "/api/hostels";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Submission failed.");
        return;
      }

      toast.success(
        mode === "create"
          ? "Listing submitted for review!"
          : "Listing updated and submitted for review."
      );
      router.push("/owner/listings");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const sectionCls = "space-y-5";
  const headingCls = "text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)] mb-5";

  return (
    <div className="mx-auto max-w-[640px]">
      <StepProgress step={step} />

      {/* -- Step 1: Basic info ----------------------- */}
      {step === 1 && (
        <div className={sectionCls}>
          <h2 className={headingCls} style={{ fontFamily: "var(--font-body)" }}>Basic info</h2>

          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Hostel name</label>
            <input id="name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Green Valley Boys Hostel" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Description</label>
            <textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="Describe your hostel's location, who it's for, what makes it a good choice for students…" className={`${inputCls} h-auto resize-none py-2.5`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="city" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">City</label>
              <select id="city" value={form.city} onChange={(e) => update("city", e.target.value)} className={`${inputCls} appearance-none`}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="area" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Area <span className="text-[var(--color-text-muted)] font-[400]">(optional)</span></label>
              <input id="area" type="text" value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="e.g. Gulberg" className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="address" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Full address</label>
            <input id="address" type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street address with landmark" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <p className="text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Gender type</p>
            <div className="flex gap-3" role="radiogroup">
              {(["MALE","FEMALE","MIXED"] as const).map((g) => (
                <label key={g} className={`flex flex-1 items-center justify-center gap-2 h-10 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all duration-[var(--transition-fast)] text-[var(--text-body-sm)] font-[500] ${form.gender === g ? "border-[var(--color-action)] bg-[var(--color-action-light)] text-[var(--color-action-dark)]" : "border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"}`}>
                  <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => update("gender", g)} className="sr-only" />
                  {g === "MALE" ? "Male only" : g === "FEMALE" ? "Female only" : "Mixed"}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="price" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Price / month (PKR)</label>
              <input id="price" type="number" value={form.pricePerMonth} onChange={(e) => update("pricePerMonth", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 8500" min={1000} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rooms" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Number of rooms</label>
              <input id="rooms" type="number" value={form.rooms} onChange={(e) => update("rooms", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 10" min={1} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="capacity" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Total capacity</label>
              <input id="capacity" type="number" value={form.capacity} onChange={(e) => update("capacity", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 30" min={1} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="minstay" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Min stay (mo)</label>
              <input id="minstay" type="number" value={form.minStay} onChange={(e) => update("minStay", e.target.value === "" ? "" : Number(e.target.value))} min={1} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="maxstay" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Max stay <span className="text-[var(--color-text-muted)] font-[400] text-[var(--text-caption)]">(opt)</span></label>
              <input id="maxstay" type="number" value={form.maxStay} onChange={(e) => update("maxStay", e.target.value === "" ? "" : Number(e.target.value))} min={1} className={inputCls} />
            </div>
          </div>
        </div>
      )}

      {/* -- Step 2: Location ------------------------- */}
      {step === 2 && (
        <div className={sectionCls}>
          <h2 className={headingCls} style={{ fontFamily: "var(--font-body)" }}>Location coordinates <span className="text-[var(--color-text-muted)] text-[var(--text-body-sm)] font-[400]">(optional)</span></h2>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] -mt-2">
            Adding coordinates shows your hostel on the map. Find them by searching your address on Google Maps and copying the coordinates from the URL.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="lat" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Latitude</label>
              <input id="lat" type="number" step="any" value={form.latitude} onChange={(e) => update("latitude", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 31.5204" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lng" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Longitude</label>
              <input id="lng" type="number" step="any" value={form.longitude} onChange={(e) => update("longitude", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 74.3587" className={inputCls} />
            </div>
          </div>
        </div>
      )}

      {/* -- Step 3: Amenities ------------------------ */}
      {step === 3 && (
        <div className={sectionCls}>
          <h2 className={headingCls} style={{ fontFamily: "var(--font-body)" }}>Amenities</h2>
          <TagInput label="What does your hostel offer?" values={form.amenities} onChange={(v) => update("amenities", v)} placeholder="Type a custom amenity and press Enter" presets={AMENITY_PRESETS} />
        </div>
      )}

      {/* -- Step 4: Photos --------------------------- */}
      {step === 4 && (
        <div className={sectionCls}>
          <h2 className={headingCls} style={{ fontFamily: "var(--font-body)" }}>Photos</h2>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] -mt-2">
            At least one photo is required before submitting for review. First photo or the one you mark as "Cover" appears in search results.
          </p>
          <PhotoUploader
            images={form.images}
            coverImage={form.coverImage}
            onChange={(imgs) => update("images", imgs)}
            onCoverChange={(url) => update("coverImage", url)}
            hostelId={hostelId}
          />
        </div>
      )}

      {/* -- Step 5: Rules ---------------------------- */}
      {step === 5 && (
        <div className={sectionCls}>
          <h2 className={headingCls} style={{ fontFamily: "var(--font-body)" }}>House rules</h2>
          <TagInput label="Rules students must follow" values={form.rules} onChange={(v) => update("rules", v)} placeholder="e.g. No guests after 10pm" />
        </div>
      )}

      {/* -- Step 6: Review & submit ------------------- */}
      {step === 6 && (
        <div className={sectionCls}>
          <h2 className={headingCls} style={{ fontFamily: "var(--font-body)" }}>Review and submit</h2>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] divide-y divide-[var(--color-border-subtle)]">
            {[
              { label: "Name",       value: form.name || "—" },
              { label: "City",       value: form.city ? `${form.city}${form.area ? `, ${form.area}` : ""}` : "—" },
              { label: "Gender",     value: form.gender },
              { label: "Price",      value: form.pricePerMonth ? `PKR ${Number(form.pricePerMonth).toLocaleString()}/mo` : "—" },
              { label: "Rooms",      value: form.rooms ? `${form.rooms} rooms, ${form.capacity} capacity` : "—" },
              { label: "Amenities",  value: form.amenities.length ? form.amenities.join(", ") : "None added" },
              { label: "Photos",     value: `${form.images.length} photo${form.images.length !== 1 ? "s" : ""}` },
              { label: "Rules",      value: form.rules.length ? `${form.rules.length} rule${form.rules.length !== 1 ? "s" : ""}` : "None added" },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4 px-5 py-3">
                <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] w-24 shrink-0">{label}</span>
                <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)] flex-1 min-w-0 break-words">{value}</span>
              </div>
            ))}
          </div>

          {form.images.length === 0 && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] border border-[oklch(0.68_0.15_72_/_0.25)] px-4 py-3 text-[var(--text-body-sm)] text-[var(--color-warning-text)]">
              ⚠ Add at least one photo before submitting.
            </div>
          )}

          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            After submitting, an admin will review your listing. You'll receive an email when it's approved.
          </p>
        </div>
      )}

      {/* -- Navigation buttons ----------------------- */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-[var(--color-border-subtle)]">
        {step > 1 && (
          <button
            type="button" onClick={back}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[var(--radius-md)] border border-[var(--color-border-default)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
          >
            <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
            Back
          </button>
        )}
        <div className="flex-1" />
        {step < STEPS.length ? (
          <button
            type="button" onClick={next}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]"
          >
            Continue
            <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || form.images.length === 0}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={15} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
            {submitting ? "Submitting…" : mode === "create" ? "Submit for review" : "Save changes"}
          </button>
        )}
      </div>
    </div>
  );
}
