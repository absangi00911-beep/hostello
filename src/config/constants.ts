// App metadata
export const APP_NAME = "HostelLo";
// NOTE: Use getAppUrl() from @/lib/app-url instead of APP_URL for proper multi-instance support
export const APP_DESCRIPTION =
  "Find verified student hostels across Pakistan. Filter by price, gender, and amenities";

// Support channels
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@hostello.pk";
export const LEGAL_EMAIL = "legal@hostello.pk";
export const PRIVACY_EMAIL = "privacy@hostello.pk";

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

// Compare
export const MAX_COMPARE_ITEMS = 3;

// Booking constraints
export const MIN_BOOKING_MONTHS = 1;
export const MAX_BOOKING_MONTHS = 24;

// Review
export const MIN_REVIEW_LENGTH = 20;
export const MAX_REVIEW_LENGTH = 1000;

// File upload limits
export const MAX_IMAGE_SIZE_MB = 5;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGES_PER_HOSTEL = 15;

// Rate limiting (attempts / window)
export const AUTH_RATE_LIMIT = { attempts: 5, windowMinutes: 15 };
export const API_RATE_LIMIT = { attempts: 100, windowMinutes: 1 };

// Revalidation intervals (seconds)
export const HOSTEL_REVALIDATE = 3600;   // 1 hour
export const SEARCH_REVALIDATE = 300;    // 5 minutes
export const HOME_REVALIDATE = 3600;     // 1 hour
