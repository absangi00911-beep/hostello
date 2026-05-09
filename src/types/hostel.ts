export interface Room {
  id: string;
  name: string;
  description?: string;
  pricePerMonth: number;
  capacity: number;
  available: number; // remaining spots
  images: string[];
  hostelId: string;
}

export interface HostelSearchResult {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string;
  pricePerMonth: number;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
  amenities: string[];
  coverImage?: string;
  images: string[];
  verified: boolean;
  rating: number;
  reviewCount: number;
  capacity: number;
  rooms: number;
  owner?: { id: string; name: string; avatar?: string };
}

export interface HostelDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  area?: string;
  address: string;
  pricePerMonth: number;
  rooms: number;
  capacity: number;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
  minStay: number;
  maxStay?: number;
  amenities: string[];
  rules: string[];
  images: string[];
  coverImage?: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  rooms_rel: Room[];
  ownerId: string;
  owner?: { id: string; name: string; avatar?: string };
  createdAt: Date;
  updatedAt: Date;
}

export type TabType = 'rooms' | 'details' | 'reviews' | 'location';
