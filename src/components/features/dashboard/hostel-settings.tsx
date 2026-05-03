"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hostel, HostelStatus } from "@prisma/client";
import styles from "./hostel-settings.module.css";
import { AMENITIES } from "@/config/amenities";

interface HostelSettingsProps {
  hostel: Pick<Hostel, "id" | "ownerId" | "name" | "description" | "amenities" | "rules" | "status">;
}

export default function HostelSettings({ hostel }: HostelSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    description: hostel.description || "",
    amenities: (hostel.amenities as string[]) || [],
    rules: (hostel.rules as string[]) || [],
    status: (hostel.status as HostelStatus) || "ACTIVE",
  });

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/hostels/${hostel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update settings");
        setLoading(false);
        return;
      }

      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => router.back()}
          className={styles.backButton}
        >
          ← Back
        </button>
        <div>
          <h1 className={styles.title}>Hostel Settings</h1>
          <p className={styles.subtitle}>{hostel.name}</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Description */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Tell guests about your hostel..."
            className={styles.textarea}
            rows={6}
          />
          <p className={styles.hint}>
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Amenities */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Amenities</h2>
          <div className={styles.amenityGrid}>
            {AMENITIES.map((amenity) => (
              <label key={amenity.id} className={styles.amenityLabel}>
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity.id)}
                  onChange={() => handleAmenityToggle(amenity.id)}
                  className={styles.checkbox}
                />
                <span className={styles.amenityName}>{amenity.emoji} {amenity.label}</span>
              </label>
            ))}
          </div>
          <p className={styles.hint}>
            Selected: {formData.amenities.length} amenities
          </p>
        </div>

        {/* Rules */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>House Rules</h2>
          <textarea
            value={formData.rules.join("\n")}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                rules: e.target.value
                  .split("\n")
                  .map((r) => r.trim())
                  .filter((r) => r.length > 0),
              }))
            }
            placeholder="Add house rules (one per line)..."
            className={styles.textarea}
            rows={6}
          />
          <p className={styles.hint}>
            {formData.rules.length} rules
          </p>
        </div>

        {/* Status */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Hostel Status</h2>
          <div className={styles.statusGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="status"
                value="ACTIVE"
                checked={formData.status === "ACTIVE"}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value as HostelStatus }))
                }
                className={styles.radio}
              />
              <span>
                <p className={styles.radioTitle}>Active</p>
                <p className={styles.radioDesc}>Hostel is visible to guests and accepting bookings</p>
              </span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="status"
                value="SUSPENDED"
                checked={formData.status === "SUSPENDED"}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value as HostelStatus }))
                }
                className={styles.radio}
              />
              <span>
                <p className={styles.radioTitle}>Suspended</p>
                <p className={styles.radioDesc}>Hostel is hidden from guests</p>
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
