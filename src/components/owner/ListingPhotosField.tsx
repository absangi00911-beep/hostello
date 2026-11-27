"use client";

import Image from "next/image";
import { X, ImagePlus } from "@/components/icons/HostelloIcons";
import { useRef, useState } from "react";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_MB,
} from "@hostello/shared";
import { prepareImageForUpload } from "@/lib/client-image-prepare";
import { LISTING_LIMITS } from "./listing-form";
import { secondaryButtonClassName } from "./ListingFormFields";

/** Client-side mirror of the /api/upload checks, so obvious problems fail fast. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Use a JPEG, PNG or WebP image.";
  }
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Each photo must be ${MAX_IMAGE_SIZE_MB}MB or smaller.`;
  }
  return null;
}

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof payload === "object" &&
        payload !== null &&
        typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Upload failed. Try again.",
    );
  }
  const url =
    typeof payload === "object" && payload !== null
      ? (payload as { url?: unknown }).url
      : undefined;
  if (typeof url !== "string" || !url) throw new Error("Upload failed. Try again.");
  return url;
}

export function ListingPhotosField({
  error,
  images,
  onChange,
}: {
  error?: string;
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const remaining = LISTING_LIMITS.imagesMax - images.length;

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;

    const problems: string[] = [];
    const accepted = files.slice(0, Math.max(0, remaining));
    if (files.length > accepted.length) {
      problems.push(
        `Only ${LISTING_LIMITS.imagesMax} photos are allowed; extra files were skipped.`,
      );
    }

    setIsUploading(true);
    let next = images;
    const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    for (const [position, original] of accepted.entries()) {
      setProgress({ current: position + 1, total: accepted.length });
      // Phone photos are often larger than the limit; shrink them here instead of
      // making the owner do it. Unsupported types skip this and fail validation below.
      const file = ACCEPTED_IMAGE_TYPES.includes(original.type)
        ? await prepareImageForUpload(original, maxBytes)
        : original;
      const invalid = validateImageFile(file);
      if (invalid) {
        const couldNotResize =
          file === original &&
          ACCEPTED_IMAGE_TYPES.includes(original.type) &&
          original.size > maxBytes;
        problems.push(
          `${original.name}: ${
            couldNotResize
              ? `This photo is over ${MAX_IMAGE_SIZE_MB}MB and could not be resized. Try a smaller image.`
              : invalid
          }`,
        );
        continue;
      }
      try {
        const url = await uploadImage(file);
        next = [...next, url];
        onChange(next);
      } catch (cause) {
        problems.push(
          `${original.name}: ${cause instanceof Error ? cause.message : "Upload failed."}`,
        );
      }
    }
    setUploadErrors(problems);
    setProgress(null);
    setIsUploading(false);
  }

  return (
    <div className="grid gap-3">
      {images.length > 0 ? (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
          {images.map((url, index) => (
            <li className="grid gap-2" key={`${url}-${index}`}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-surface-muted">
                <Image
                  alt={index === 0 ? "Cover photo" : `Listing photo ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="200px"
                  src={url}
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-md bg-white px-2 py-[2px] text-label font-bold text-ink">
                    Cover
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {index > 0 ? (
                  <button
                    className={`${secondaryButtonClassName} min-h-11 px-3 text-label`}
                    disabled={isUploading}
                    onClick={() =>
                      onChange([url, ...images.filter((_, i) => i !== index)])
                    }
                    type="button"
                  >
                    Make cover
                  </button>
                ) : null}
                <button
                  aria-label={`Remove photo ${index + 1}`}
                  className={`${secondaryButtonClassName} min-h-11 gap-1 px-3 text-label`}
                  disabled={isUploading}
                  onClick={() => onChange(images.filter((_, i) => i !== index))}
                  type="button"
                >
                  <X aria-hidden="true" size={13} />
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          aria-label="Add listing photos"
          className="sr-only"
          disabled={isUploading || remaining <= 0}
          id="listing-photos-input"
          multiple
          onChange={(event) => void handleFiles(event.currentTarget.files)}
          ref={inputRef}
          type="file"
        />
        <button
          className={`${secondaryButtonClassName} gap-2`}
          disabled={isUploading || remaining <= 0}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <ImagePlus aria-hidden="true" size={16} />
          {isUploading
            ? progress && progress.total > 1
              ? `Uploading ${progress.current} of ${progress.total}…`
              : "Uploading…"
            : "Add photos"}
        </button>
        <span aria-live="polite" className="text-label text-muted">
          {images.length}/{LISTING_LIMITS.imagesMax} photos · JPEG, PNG or WebP. Photos over{" "}
          {MAX_IMAGE_SIZE_MB}MB are resized automatically. The first photo is the cover.
        </span>
      </div>

      {error ? (
        <p className="m-0 text-label text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {uploadErrors.length > 0 ? (
        <ul className="m-0 grid gap-1 pl-5 text-label text-danger" role="alert">
          {uploadErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
