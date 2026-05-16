// Path: src/types/index.ts

import type { Hostel as PrismaHostel, User as PrismaUser, Review as PrismaReview, Booking as PrismaBooking, Room } from "@prisma/client";
import type { 
  UserRole, 
  HostelFilters, 
  SearchParams, 
  PaginatedResponse, 
  ApiResponse, 
  AmenityConfig, 
  CompareItem,
  HostelWithOwner,
  HostelWithDetails,
  ReviewWithUser,
  BookingWithHostel
} from "@hostello/shared/types";

export type { 
  UserRole,
  HostelFilters,
  SearchParams,
  PaginatedResponse,
  ApiResponse,
  AmenityConfig,
  CompareItem,
  HostelWithOwner,
  HostelWithDetails,
  ReviewWithUser,
  BookingWithHostel,
  Room
};

// Use Prisma types for core entities in the web app to maintain backend compatibility
export type Hostel = PrismaHostel;
export type User = PrismaUser;
export type Review = PrismaReview;
export type Booking = PrismaBooking;