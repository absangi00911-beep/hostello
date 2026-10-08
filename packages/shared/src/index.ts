export * from "./types";
export * from "./validations";

// Constants
export {
  APP_NAME,
  APP_DESCRIPTION,
  SUPPORT_EMAIL,
  LEGAL_EMAIL,
  PRIVACY_EMAIL,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_COMPARE_ITEMS,
  MIN_BOOKING_MONTHS,
  MAX_BOOKING_MONTHS,
  MIN_REVIEW_LENGTH,
  MAX_REVIEW_LENGTH,
  MAX_IMAGE_SIZE_MB,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES_PER_HOSTEL,
  AUTH_RATE_LIMIT,
  API_RATE_LIMIT,
  MOBILE_SESSION_MAX_AGE_SECONDS,
  HOSTEL_REVALIDATE,
  SEARCH_REVALIDATE,
  HOME_REVALIDATE,
} from "./constants/config";

// Amenities, Cities, and related constants
export {
  AMENITIES,
  AMENITY_MAP,
  CITIES,
  PRICE_RANGES,
  SORT_OPTIONS,
  type Amenity,
  type City,
} from "./constants/amenities";

// Universities and related constants/functions
export {
  UNIVERSITIES,
  POPULAR_UNIVERSITIES,
  universityToSlug,
  slugToUniversity,
  type University,
} from "./constants/universities";

// String utilities
export { escapeHtml, slugify, truncate, pluralize, getInitials } from "./utils/strings";

// Date utilities
export * from "./utils/dates";

// Currency utilities
export * from "./utils/currency";
