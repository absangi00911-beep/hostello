'use client';

import React, { useState } from 'react';
import { ArrowLeft, Star, MapPin } from 'lucide-react';

interface SubmitReviewProps {
  hostelName?: string;
  hostelLocation?: string;
  stayDates?: string;
  onSubmit?: (review: ReviewData) => void;
  onCancel?: () => void;
}

interface ReviewData {
  overallRating: number;
  specificRatings: {
    cleanliness: number;
    location: number;
    value: number;
    safety: number;
  };
  title: string;
  body: string;
}

export default function SubmitReviewResponsive({
  hostelName = 'The Sunny Backpackers',
  hostelLocation = 'Barcelona, Spain',
  stayDates = 'Aug 12 - Aug 15, 2023',
  onSubmit = () => {},
  onCancel = () => {},
}: SubmitReviewProps) {
  const [overallRating, setOverallRating] = useState(4);
  const [hoverRating, setHoverRating] = useState(0);
  const [specificRatings, setSpecificRatings] = useState({
    cleanliness: 4,
    location: 5,
    value: 3,
    safety: 4,
  });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredCategoryRating, setHoveredCategoryRating] = useState(0);

  const specificCategories = [
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'location', label: 'Location' },
    { key: 'value', label: 'Value' },
    { key: 'safety', label: 'Safety' },
  ];

  const handleOverallRating = (rating: number) => {
    setOverallRating(rating);
  };

  const handleSpecificRating = (category: keyof typeof specificRatings, rating: number) => {
    setSpecificRatings((prev) => ({
      ...prev,
      [category]: rating,
    }));
  };

  const handleSubmit = () => {
    onSubmit({
      overallRating,
      specificRatings,
      title,
      body,
    });
  };

  const renderStars = (rating: number, hovered: number, maxRating: number = 5, size: 'sm' | 'lg' = 'lg') => {
    const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    const displayRating = hovered || rating;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((index) => (
          <button
            key={index}
            className={`transition-colors focus:outline-none focus:ring-2 focus:ring-warning/50 rounded ${sizeClass}`}
            onMouseEnter={() => (size === 'lg' ? setHoverRating(index) : setHoveredCategoryRating(index))}
            onMouseLeave={() => (size === 'lg' ? setHoverRating(0) : setHoveredCategoryRating(0))}
            onClick={() => {
              if (size === 'lg') {
                handleOverallRating(index);
              }
            }}
          >
            <Star
              className={`w-full h-full ${
                index <= displayRating ? 'fill-warning text-warning' : 'text-border-strong'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-bg-page text-text-body font-body-default antialiased min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[600px] bg-bg-card rounded-xl border border-border-default shadow-sm overflow-hidden flex flex-col">
        {/* ===== HEADER / NAVIGATION BACK ===== */}
        <div className="p-4 border-b border-border-default flex items-center gap-3 bg-surface-container-lowest sticky top-0 z-10">
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-surface-variant transition-colors text-text-heading flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-warning/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-h3 text-h3 text-text-heading m-0">Submit Review</h1>
        </div>

        {/* ===== HOSTEL COMPACT CARD ===== */}
        <div className="p-4 md:p-6 bg-surface-container-lowest border-b border-border-default">
          <div className="flex items-center gap-4">
            {/* Image */}
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-border-default flex-shrink-0 bg-surface-dim" />

            {/* Info */}
            <div>
              <h2 className="font-h3 text-h3 text-text-heading mb-1">{hostelName}</h2>
              <p className="font-body-default text-body-default text-text-muted flex items-center gap-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {hostelLocation}
              </p>
              <p className="font-label text-label text-text-muted mt-1">Stayed: {stayDates}</p>
            </div>
          </div>
        </div>

        {/* ===== FORM CONTENT ===== */}
        <div className="p-4 md:p-6 flex flex-col gap-6">
          {/* ===== OVERALL RATING ===== */}
          <div className="flex flex-col items-center py-4 border-b border-border-default">
            <label className="font-label text-label text-text-heading mb-3 uppercase tracking-wider">
              Overall Rating
            </label>
            <div className="flex gap-2 cursor-pointer">
              {[1, 2, 3, 4, 5].map((index) => (
                <button
                  key={index}
                  onClick={() => handleOverallRating(index)}
                  onMouseEnter={() => setHoverRating(index)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-colors focus:outline-none focus:ring-2 focus:ring-warning/50 rounded"
                >
                  <Star
                    className={`w-8 h-8 ${
                      index <= (hoverRating || overallRating)
                        ? 'fill-warning text-warning'
                        : 'text-border-strong'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="font-body-default text-body-default text-text-muted mt-2">
              {overallRating} out of 5 -{' '}
              {overallRating === 5
                ? 'Excellent'
                : overallRating === 4
                  ? 'Great'
                  : overallRating === 3
                    ? 'Good'
                    : overallRating === 2
                      ? 'Fair'
                      : 'Poor'}
            </p>
          </div>

          {/* ===== SPECIFIC RATINGS ===== */}
          <div className="flex flex-col gap-4">
            <label className="font-label text-label text-text-heading uppercase tracking-wider">
              Rate specific areas
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {specificCategories.map((category) => {
                const categoryKey = category.key as keyof typeof specificRatings;
                const rating = specificRatings[categoryKey];

                return (
                  <div
                    key={category.key}
                    className="flex items-center justify-between"
                    onMouseLeave={() => {
                      setHoveredCategory(null);
                      setHoveredCategoryRating(0);
                    }}
                  >
                    <span className="font-body-default text-body-default text-text-heading">
                      {category.label}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((index) => (
                        <button
                          key={index}
                          onMouseEnter={() => {
                            setHoveredCategory(category.key);
                            setHoveredCategoryRating(index);
                          }}
                          onClick={() => handleSpecificRating(categoryKey, index)}
                          className="transition-colors focus:outline-none focus:ring-2 focus:ring-warning/50 rounded"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              index <=
                              (hoveredCategory === category.key
                                ? hoveredCategoryRating
                                : rating)
                                ? 'fill-warning text-warning'
                                : 'text-border-strong'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== TEXT FIELDS ===== */}
          <div className="flex flex-col gap-4 border-t border-border-default pt-6">
            {/* Review Title */}
            <div className="flex flex-col gap-1">
              <label className="font-label text-label text-text-heading" htmlFor="review-title">
                Review Title
              </label>
              <input
                className="h-[42px] px-3 border border-border-default rounded bg-surface-container-lowest text-text-body font-body-default focus:border-warning focus:ring-1 focus:ring-warning/50 outline-none transition-shadow w-full"
                id="review-title"
                placeholder="Summarize your stay in a few words"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Review Body */}
            <div className="flex flex-col gap-1">
              <label className="font-label text-label text-text-heading" htmlFor="review-body">
                Your Review
              </label>
              <textarea
                className="p-3 border border-border-default rounded bg-surface-container-lowest text-text-body font-body-default focus:border-warning focus:ring-1 focus:ring-warning/50 outline-none transition-shadow w-full resize-y"
                id="review-body"
                placeholder="What did you like? What could be improved? Be honest and helpful to other students."
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ===== FOOTER / ACTION ===== */}
        <div className="p-4 md:p-6 bg-surface-container-lowest border-t border-border-default flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-label text-label text-text-heading border border-border-default rounded bg-surface-container-lowest hover:bg-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-warning/50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 font-label text-label text-on-primary bg-action hover:bg-action-pressed active:scale-[0.97] transition-all duration-200 rounded focus:outline-none focus:ring-2 focus:ring-action/50 shadow-sm hover:-translate-y-[1px] hover:shadow-md flex items-center justify-center"
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
