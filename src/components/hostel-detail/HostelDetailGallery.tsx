"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Share2, X } from "lucide-react";
import { useRef, useState } from "react";

interface HostelDetailGalleryProps {
  slug: string;
  name: string;
  photos: string[];
  initiallySaved: boolean;
}

function readMessage(value: unknown): string | null {
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

export function HostelDetailGallery({
  slug,
  name,
  photos,
  initiallySaved,
}: HostelDetailGalleryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSaved, setIsSaved] = useState(initiallySaved);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const mosaicPhotos = photos.slice(0, 5);

  async function shareListing() {
    setActionMessage("");

    try {
      if (navigator.share) {
        await navigator.share({ title: name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setActionMessage("Link copied.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setActionMessage("Could not share the listing. Please try again.");
    }
  }

  async function toggleSaved() {
    setIsSaving(true);
    setActionMessage("");

    try {
      const response = await fetch(`/api/hostels/${encodeURIComponent(slug)}/favorite`, {
        method: isSaved ? "DELETE" : "POST",
      });

      if (!response.ok) {
        const result: unknown = await response.json();
        setActionMessage(
          response.status === 401
            ? "Sign in to save this hostel."
            : readMessage(result) ?? "Could not update your saved hostels.",
        );
        return;
      }

      const result: unknown = await response.json();
      if (
        typeof result !== "object" ||
        result === null ||
        !("saved" in result) ||
        typeof result.saved !== "boolean"
      ) {
        setActionMessage("Could not confirm the saved-hostel update.");
        return;
      }

      setIsSaved(result.saved);
      setActionMessage(result.saved ? "Hostel saved." : "Hostel removed from saved.");
    } catch {
      setActionMessage("Could not update your saved hostels. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="hostel-detail-intro" aria-labelledby="hostel-detail-title">
        <div className="hostel-detail-title-row">
          <h1 id="hostel-detail-title">{name}</h1>
          <div className="hostel-detail-actions">
            <button onClick={() => void shareListing()} type="button">
              <Share2 aria-hidden="true" size={16} />
              <span>Share</span>
            </button>
            <button
              aria-pressed={isSaved}
              disabled={isSaving}
              onClick={() => void toggleSaved()}
              type="button"
            >
              <Heart aria-hidden="true" fill={isSaved ? "currentColor" : "none"} size={16} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
        <div
          className="hostel-detail-gallery"
          data-photo-count={Math.max(1, mosaicPhotos.length)}
        >
          {mosaicPhotos.length > 0 ? (
            mosaicPhotos.map((photo, index) => (
              <div className="hostel-detail-photo" key={`${photo}-${index}`}>
                <Image
                  alt={`${name} photo ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 34vw"
                  src={photo}
                />
              </div>
            ))
          ) : (
            <div className="hostel-detail-photo-fallback" role="img">
              Photos are not available for this hostel yet.
            </div>
          )}
          {photos.length > 0 && (
            <button
              className="hostel-detail-show-photos"
              onClick={() => dialogRef.current?.showModal()}
              type="button"
            >
              Show all {photos.length} photos
            </button>
          )}
        </div>
        {actionMessage && (
          <p aria-live="polite" className="hostel-detail-action-message" role="status">
            {actionMessage}
            {actionMessage === "Sign in to save this hostel." && (
              <>
                {" "}
                <Link href="/login">Sign in</Link>
              </>
            )}
          </p>
        )}
      </section>

      {photos.length > 0 && (
        <dialog
          aria-label={`Photos of ${name}`}
          className="hostel-detail-photo-dialog"
          ref={dialogRef}
        >
          <div className="hostel-detail-dialog-header">
            <h2>{photos.length} photos</h2>
            <button
              aria-label="Close photos"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
          <div className="hostel-detail-dialog-photos">
            {photos.map((photo, index) => (
              <Image
                alt={`${name} photo ${index + 1}`}
                height={720}
                key={`${photo}-all-${index}`}
                src={photo}
                width={960}
              />
            ))}
          </div>
        </dialog>
      )}
    </>
  );
}
