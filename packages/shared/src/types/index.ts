// Expose core types. 
// Note: We avoid importing @prisma/client here to keep the shared package 
// lightweight and usable in React Native / non-node environments where possible.
// We only import what is strictly needed for domain-agnostic logic.

export type UserRole = "STUDENT" | "OWNER" | "ADMIN";

export interface HostelFilters {
  city?: string;
  gender?: "MALE" | "FEMALE" | "MIXED";
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  verified?: boolean;
  q?: string;
}

export interface SearchParams extends HostelFilters {
  page?: number;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email?: string;
  name: string | null;
  avatar: string | null;
  phone: string | null;
  role: UserRole;
}

export interface Hostel {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  city: string;
  area: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  pricePerMonth: number;
  gender: "MALE" | "FEMALE" | "MIXED";
  amenities: string[];
  rules: string[];
  images: string[];
  coverImage: string | null;
  verified: boolean;
  featured: boolean;
  viewCount: number;
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  ownerReply: string | null;
  repliedAt: Date | string | null;
  createdAt: Date | string;
}

export interface Booking {
  id: string;
  hostelId: string;
  userId: string;
  checkIn: Date | string;
  checkOut: Date | string;
  months: number;
  guests: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: Date | string;
}

export type HostelWithOwner = Hostel & {
  owner: Pick<User, "id" | "name" | "avatar" | "phone">;
};

export type ReviewWithUser = Review & {
  user: Pick<User, "id" | "name" | "avatar">;
};

export type HostelWithDetails = HostelWithOwner & {
  reviews: ReviewWithUser[];
  _count: { favorites: number };
};

export type BookingWithHostel = Booking & {
  hostel: Pick<Hostel, "id" | "name" | "slug" | "coverImage" | "city">;
};

export interface CompareItem {
  slug: string;
  name: string;
  image: string | null;
}

export interface AmenityConfig {
  id: string;
  label: string;
  icon: string;
}
