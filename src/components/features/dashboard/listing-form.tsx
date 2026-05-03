"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./listing-form.module.css";
import { AMENITIES, CITIES } from "@/config/amenities";
import { HostelCreateInput } from "@/lib/validations";

interface ListingFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function ListingForm({
  initialData,
  isEditing = false,
}: ListingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    city: initialData?.city || "",
    area: initialData?.area || "",
    address: initialData?.address || "",
    pricePerMonth: initialData?.pricePerMonth || "",
    rooms: initialData?.rooms || "",
    capacity: initialData?.capacity || "",
    gender: initialData?.gender || "MIXED",
    minStay: initialData?.minStay || 1,
    maxStay: initialData?.maxStay || "",
    amenities: initialData?.amenities || [],
    rules: initialData?.rules || [],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a: string) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const handleRuleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rules = e.target.value
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
    setFormData((prev) => ({
      ...prev,
      rules,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Validate required fields
      if (
        !formData.name ||
        !formData.description ||
        !formData.city ||
        !formData.address ||
        !formData.pricePerMonth ||
        !formData.rooms ||
        !formData.capacity ||
        formData.amenities.length === 0
      ) {
        setError("Please fill all required fields and select at least one amenity");
        setLoading(false);
        return;
      }

      const payload: HostelCreateInput = {
        name: formData.name,
        description: formData.description,
        city: formData.city,
        area: formData.area || undefined,
        address: formData.address,
        pricePerMonth: parseInt(formData.pricePerMonth),
        rooms: parseInt(formData.rooms),
        capacity: parseInt(formData.capacity),
        gender: formData.gender as any,
        minStay: parseInt(String(formData.minStay)),
        maxStay: formData.maxStay ? parseInt(formData.maxStay) : undefined,
        amenities: formData.amenities,
        rules: formData.rules,
      };

      const url = isEditing
        ? `/api/hostels/${initialData.id}`
        : "/api/hostels";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save listing");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/listings");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const categorizedAmenities = AMENITIES.reduce(
    (acc, amenity) => {
      if (!acc[amenity.category]) {
        acc[amenity.category] = [];
      }
      acc[amenity.category].push(amenity);
      return acc;
    },
    {} as Record<string, typeof AMENITIES>
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContainer}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {isEditing ? "Edit Listing" : "Create New Listing"}
          </h1>
          <p className={styles.subtitle}>
            Fill in the details about your hostel
          </p>
        </div>

        {/* Status Messages */}
        {error && <div className={styles.error}>{error}</div>}
        {success && (
          <div className={styles.success}>
            ✓ {isEditing ? "Listing updated" : "Listing created"} successfully!
          </div>
        )}

        {/* Basic Info Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>

          {/* Name */}
          <div className={styles.group}>
            <label className={styles.label}>
              Hostel Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Green Valley Hostel"
              maxLength={100}
              className={styles.input}
              disabled={loading}
              required
            />
            <p className={styles.hint}>3-100 characters</p>
          </div>

          {/* Description */}
          <div className={styles.group}>
            <label className={styles.label}>
              Description <span className={styles.required}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your hostel, its atmosphere, and what makes it unique..."
              maxLength={2000}
              rows={6}
              className={styles.textarea}
              disabled={loading}
              required
            />
            <p className={styles.hint}>
              {formData.description.length}/2000 characters
            </p>
          </div>
        </div>

        {/* Location Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Location</h2>

          {/* City */}
          <div className={styles.group}>
            <label className={styles.label}>
              City <span className={styles.required}>*</span>
            </label>
            <select
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={styles.select}
              disabled={loading}
              required
            >
              <option value="">Select a city</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Area */}
          <div className={styles.group}>
            <label className={styles.label}>Area</label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              placeholder="e.g., Defence, Model Town"
              className={styles.input}
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div className={styles.group}>
            <label className={styles.label}>
              Full Address <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter complete street address"
              minLength={10}
              className={styles.input}
              disabled={loading}
              required
            />
            <p className={styles.hint}>At least 10 characters</p>
          </div>
        </div>

        {/* Pricing & Capacity Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pricing & Capacity</h2>

          <div className={styles.grid2}>
            {/* Price */}
            <div className={styles.group}>
              <label className={styles.label}>
                Price per Month (Rs) <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                name="pricePerMonth"
                value={formData.pricePerMonth}
                onChange={handleInputChange}
                placeholder="1000"
                min="1000"
                max="100000"
                className={styles.input}
                disabled={loading}
                required
              />
              <p className={styles.hint}>Rs. 1,000 - Rs. 100,000</p>
            </div>

            {/* Rooms */}
            <div className={styles.group}>
              <label className={styles.label}>
                Number of Rooms <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                name="rooms"
                value={formData.rooms}
                onChange={handleInputChange}
                placeholder="10"
                min="1"
                max="500"
                className={styles.input}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.grid2}>
            {/* Capacity */}
            <div className={styles.group}>
              <label className={styles.label}>
                Total Capacity <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="50"
                min="1"
                max="1000"
                className={styles.input}
                disabled={loading}
                required
              />
              <p className={styles.hint}>Total beds in hostel</p>
            </div>

            {/* Gender */}
            <div className={styles.group}>
              <label className={styles.label}>
                Type <span className={styles.required}>*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={styles.select}
                disabled={loading}
                required
              >
                <option value="MALE">Male Only</option>
                <option value="FEMALE">Female Only</option>
                <option value="MIXED">Co-ed</option>
              </select>
            </div>
          </div>

          <div className={styles.grid2}>
            {/* Min Stay */}
            <div className={styles.group}>
              <label className={styles.label}>Minimum Stay (days)</label>
              <input
                type="number"
                name="minStay"
                value={formData.minStay}
                onChange={handleInputChange}
                min="1"
                className={styles.input}
                disabled={loading}
              />
            </div>

            {/* Max Stay */}
            <div className={styles.group}>
              <label className={styles.label}>Maximum Stay (days)</label>
              <input
                type="number"
                name="maxStay"
                value={formData.maxStay}
                onChange={handleInputChange}
                min="1"
                placeholder="Leave empty for no limit"
                className={styles.input}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Amenities Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Amenities <span className={styles.required}>*</span>
          </h2>
          <p className={styles.hint}>Select at least one amenity</p>

          {Object.entries(categorizedAmenities).map(([category, amenities]) => (
            <div key={category} className={styles.amenityCategory}>
              <h3 className={styles.categoryName}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              <div className={styles.amenityGrid}>
                {amenities.map((amenity) => (
                  <label key={amenity.id} className={styles.amenityCheckbox}>
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      disabled={loading}
                    />
                    <span>
                      {amenity.emoji} {amenity.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rules Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>House Rules</h2>

          <div className={styles.group}>
            <label className={styles.label}>House Rules</label>
            <textarea
              value={formData.rules.join("\n")}
              onChange={handleRuleChange}
              placeholder="Enter one rule per line&#10;e.g.:&#10;No smoking&#10;No loud music after 10 PM&#10;Checkout at 11 AM"
              rows={5}
              className={styles.textarea}
              disabled={loading}
            />
            <p className={styles.hint}>
              {formData.rules.length} rule(s) added
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.buttonSecondary}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.buttonPrimary}
            disabled={loading}
          >
            {loading ? "Saving..." : isEditing ? "Update Listing" : "Create Listing"}
          </button>
        </div>
      </div>
    </form>
  );
}
