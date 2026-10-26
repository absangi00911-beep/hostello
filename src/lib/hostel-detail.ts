import { db } from "@/lib/db";
import { hostelIdOrSlugWhere } from "@/lib/hostel-service";
import {
  isBoundedRouteParam,
  MAX_HOSTEL_ROUTE_PARAM_LENGTH,
} from "@/lib/route-params";

export async function getPublicHostelDetail(param: string) {
  if (!isBoundedRouteParam(param, MAX_HOSTEL_ROUTE_PARAM_LENGTH)) return null;

  const hostel = await db.hostel.findFirst({
    where: {
      ...hostelIdOrSlugWhere(param),
      status: "ACTIVE",
    },
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      area: true,
      description: true,
      amenities: true,
      pricePerMonth: true,
      gender: true,
      rooms: true,
      capacity: true,
      minStay: true,
      maxStay: true,
      cancellationPolicy: true,
      images: true,
      coverImage: true,
      verified: true,
      rating: true,
      reviewCount: true,
      latitude: true,
      longitude: true,
      owner: {
        select: {
          id: true,
          name: true,
          avatar: true,
          bio: true,
          city: true,
          createdAt: true,
          hostResponseSummary: {
            select: {
              guestStartedThreadCount: true,
              repliedThreadCount: true,
              medianResponseSeconds: true,
            },
          },
        },
      },
      rooms_rel: {
        where: { available: { gt: 0 } },
        orderBy: { pricePerMonth: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          pricePerMonth: true,
          capacity: true,
          available: true,
          images: true,
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          cleanliness: true,
          location: true,
          value: true,
          safety: true,
          ownerReply: true,
          createdAt: true,
          verified: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!hostel) return null;
  if (hostel.reviewCount === 0 && hostel.reviews.length === 0) {
    return { ...hostel, reviewCategoryRatings: null };
  }

  const [cleanliness, location, value, safety] = await Promise.all([
    db.review.aggregate({
      where: {
        hostelId: hostel.id,
        hostel: { is: { status: "ACTIVE" } },
        cleanliness: { gt: 0 },
      },
      _avg: { cleanliness: true },
    }),
    db.review.aggregate({
      where: {
        hostelId: hostel.id,
        hostel: { is: { status: "ACTIVE" } },
        location: { gt: 0 },
      },
      _avg: { location: true },
    }),
    db.review.aggregate({
      where: {
        hostelId: hostel.id,
        hostel: { is: { status: "ACTIVE" } },
        value: { gt: 0 },
      },
      _avg: { value: true },
    }),
    db.review.aggregate({
      where: {
        hostelId: hostel.id,
        hostel: { is: { status: "ACTIVE" } },
        safety: { gt: 0 },
      },
      _avg: { safety: true },
    }),
  ]);

  return {
    ...hostel,
    reviewCategoryRatings: {
      cleanliness: cleanliness._avg.cleanliness,
      location: location._avg.location,
      value: value._avg.value,
      safety: safety._avg.safety,
    },
  };
}
