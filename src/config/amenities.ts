export interface Amenity {
  id: string;
  label: string;
  emoji: string;
  category: "connectivity" | "meals" | "facilities" | "safety" | "comfort";
}

export const AMENITIES: Amenity[] = [
  // Connectivity
  { id: "wifi", label: "Wi-Fi", emoji: "📶", category: "connectivity" },
  { id: "fiber", label: "Fiber Internet", emoji: "⚡", category: "connectivity" },

  // Meals
  { id: "meals", label: "Meals Included", emoji: "🍽️", category: "meals" },
  { id: "breakfast", label: "Breakfast Only", emoji: "☕", category: "meals" },
  { id: "kitchen", label: "Shared Kitchen", emoji: "🍳", category: "meals" },

  // Facilities
  { id: "laundry", label: "Laundry", emoji: "🫧", category: "facilities" },
  { id: "study-room", label: "Study Room", emoji: "📚", category: "facilities" },
  { id: "gym", label: "Gym", emoji: "💪", category: "facilities" },
  { id: "parking", label: "Parking", emoji: "🚗", category: "facilities" },
  { id: "rooftop", label: "Rooftop", emoji: "🌇", category: "facilities" },
  { id: "courtyard", label: "Courtyard", emoji: "🌿", category: "facilities" },
  { id: "elevator", label: "Elevator", emoji: "🛗", category: "facilities" },

  // Safety
  { id: "cctv", label: "CCTV", emoji: "📷", category: "safety" },
  { id: "generator", label: "Generator", emoji: "🔋", category: "safety" },
  { id: "guard", label: "Security Guard", emoji: "💂", category: "safety" },
  { id: "female-staff", label: "Female Staff", emoji: "👩", category: "safety" },

  // Comfort
  { id: "ac", label: "Air Conditioning", emoji: "❄️", category: "comfort" },
  { id: "attached-bath", label: "Attached Bath", emoji: "🚿", category: "comfort" },
  { id: "hot-water", label: "Hot Water", emoji: "🌡️", category: "comfort" },
  { id: "water-cooler", label: "Water Cooler", emoji: "💧", category: "comfort" },
  { id: "tv", label: "TV Lounge", emoji: "📺", category: "comfort" },
];

export const AMENITY_MAP = Object.fromEntries(
  AMENITIES.map((a) => [a.id, a])
) as Record<string, Amenity>;

export const CITIES = [
  "Lahore",
  "Islamabad",
  "Karachi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Rawalpindi",
  "Quetta",
] as const;

export type City = (typeof CITIES)[number];

export const PRICE_RANGES = [
  { label: "Under Rs. 6,000", min: 0, max: 6000 },
  { label: "Rs. 6,000 – 9,000", min: 6000, max: 9000 },
  { label: "Rs. 9,000 – 12,000", min: 9000, max: 12000 },
  { label: "Rs. 12,000 – 15,000", min: 12000, max: 15000 },
  { label: "Rs. 15,000+", min: 15000, max: 999999 },
] as const;

export const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
] as const;
