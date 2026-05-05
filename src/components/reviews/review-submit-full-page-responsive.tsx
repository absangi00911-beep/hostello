'use client';

import React, { useState } from 'react';
import { ArrowBack, Star, Calendar, MapPin, Check } from 'lucide-react';

interface ReviewSubmitFullPageProps {
  hostelName?: string;
  stayDates?: string;
  onSubmit?: (review: ReviewData) => void;
  onCancel?: () => void;
  onProfileClick?: () => void;
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

export default function ReviewSubmitFullPageResponsive({
  hostelName = 'The Sunny Backpackers',
  stayDates = 'Oct 12 - Oct 15, 2023',
  onSubmit = () => {},
  onCancel = () => {},
  onProfileClick = () => {},
}: ReviewSubmitFullPageProps) {
  const [overallRating, setOverallRating] = useState(4);
  const [hoverOverall, setHoverOverall] = useState(0);
  const [specificRatings, setSpecificRatings] = useState({
    cleanliness: 4,
    location: 5,
    value: 4,
    safety: 5,
  });
  const [hoverCategory, setHoverCategory] = useState<string | null>(null);
  const [hoverCategoryRating, setHoverCategoryRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const categories = [
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'location', label: 'Location' },
    { key: 'value', label: 'Value' },
    { key: 'safety', label: 'Safety' },
  ];

  const handleSubmit = () => {
    onSubmit({
      overallRating,
      specificRatings,
      title,
      body,
    });
  };

  const renderStars = (
    rating: number,
    hovered: number,
    maxStars: number = 5,
    size: 'sm' | 'lg' = 'lg'
  ) => {
    const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
    const displayRating = hovered || rating;

    return (
      <div className="flex gap-1 items-center justify-center md:justify-start">
        {[1, 2, 3, 4, 5].map((index) => (
          <button
            key={index}
            className={`${sizeClass} transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container/50 rounded`}
          >
            <Star
              className={`w-full h-full ${
                index <= displayRating
                  ? 'fill-primary-container text-primary-container'
                  : 'text-outline-variant'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-bg-page min-h-screen text-text-body font-body-default flex flex-col">
      {/* ===== FIXED TOP APP BAR ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-page text-text-heading font-h2 font-bold tracking-tight text-xl flex justify-between items-center w-full px-4 md:px-8 h-16 border-b border-border-default">
        <button
          onClick={onCancel}
          className="text-text-muted hover:bg-bg-raised transition-colors p-2 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-container/50"
        >
          <ArrowBack className="w-5 h-5" />
        </button>
        <span className="text-primary-container font-black">Settings</span>
        <button
          onClick={onProfileClick}
          className="w-8 h-8 rounded-full bg-border-default overflow-hidden flex items-center justify-center text-text-muted hover:bg-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container/50"
        >
          <span className="text-sm">👤</span>
        </button>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 w-full max-w-[720px] mx-auto mt-16 md:mt-24 pb-24 px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="font-h1 text-h1 text-text-heading mb-2">Submit Review</h1>
          <p className="font-body-lg text-body-lg text-text-muted">
            Share your experience to help fellow travelers.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-bg-card rounded-xl border border-border-default shadow-sm p-6 md:p-8">
          {/* ===== HOSTEL COMPACT CARD ===== */}
          <div className="flex items-center gap-4 p-4 bg-bg-raised rounded-lg border border-border-default mb-8">
            {/* Image */}
            <div className="w-20 h-20 rounded-md overflow-hidden bg-surface-variant flex-shrink-0 relative">
              <div className="w-full h-full bg-gradient-to-br from-surface-dim to-surface-container" />
              {/* Verified Badge */}
              <div className="absolute top-1 left-1 bg-surface-container-lowest rounded-full p-0.5 shadow-sm flex items-center justify-center">
                <Check className="w-3 h-3 text-success" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-grow">
              <h3 className="font-h3 text-[1.125rem] text-text-heading mb-1">{hostelName}</h3>
              <p className="font-body-default text-text-muted flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {stayDates}
              </p>
            </div>
          </div>

          {/* ===== OVERALL RATING ===== */}
          <div className="mb-8 text-center pb-8 border-b border-border-default">
            <label className="font-label text-label text-text-heading block mb-3 uppercase tracking-wider">
              Overall Rating
            </label>
            <div className="flex justify-center">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((index) => (
                  <button
                    key={index}
                    onMouseEnter={() => setHoverOverall(index)}
                    onMouseLeave={() => setHoverOverall(0)}
                    onClick={() => setOverallRating(index)}
                    className="transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container/50 rounded"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        index <= (hoverOverall || overallRating)
                          ? 'fill-primary-container text-primary-container'
                          : 'text-outline-variant'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===== SPECIFIC CATEGORIES ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {categories.map((category) => {
              const categoryKey = category.key as keyof typeof specificRatings;
              const rating = specificRatings[categoryKey];
              const isHovered = hoverCategory === category.key;

              return (
                <div
                  key={category.key}
                  className="flex flex-col gap-1"
                  onMouseLeave={() => {
                    setHoverCategory(null);
                    setHoverCategoryRating(0);
                  }}
                >
                  <label className="font-label text-label text-text-body">{category.label}</label>
                  <div className="flex gap-1 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <button
                        key={index}
                        onMouseEnter={() => {
                          setHoverCategory(category.key);
                          setHoverCategoryRating(index);
                        }}
                        onClick={() => {
                          setSpecificRatings((prev) => ({
                            ...prev,
                            [categoryKey]: index,
                          }));
                        }}
                        className="transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container/50 rounded"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            index <=
                            (isHovered ? hoverCategoryRating : rating)
                              ? 'fill-primary-container text-primary-container'
                              : 'text-outline-variant'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===== WRITTEN REVIEW ===== */}
          <div className="flex flex-col gap-6 mb-8">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-label text-text-heading" htmlFor="review-title">
                Review Title
              </label>
              <input
                className="h-[42px] px-3 bg-surface-container-lowest border border-border-default rounded text-text-body placeholder:text-text-placeholder focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-all outline-none font-body-default"
                id="review-title"
                placeholder="Summarize your experience"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Body */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-label text-text-heading" htmlFor="review-body">
                Your Review
              </label>
              <textarea
                className="p-3 bg-surface-container-lowest border border-border-default rounded text-text-body placeholder:text-text-placeholder focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-all outline-none font-body-default resize-y"
                id="review-body"
                placeholder="What did you like or dislike? Would you recommend this place?"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>

          {/* ===== ACTION BUTTONS ===== */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-border-default">
            <button
              onClick={onCancel}
              className="font-label text-label text-text-body bg-transparent hover:bg-surface-variant border border-transparent rounded px-6 py-2 transition-colors active:scale-95 h-[42px] focus:outline-none focus:ring-2 focus:ring-primary-container/50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="font-label text-label text-on-primary bg-action hover:bg-action-dark active:scale-[0.97] rounded px-6 py-2 transition-all duration-200 shadow-sm hover:-translate-y-[1px] hover:shadow-md h-[42px] focus:outline-none focus:ring-2 focus:ring-action/50"
            >
              Submit Review
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
