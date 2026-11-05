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
        where: { capacity: { gt: 0 } },
        orderBy: { pricePerMonth: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          pricePerMonth: true,
          capacity: true,
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
          user: { select: { name: true, avatar: true } },
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

type PublicHostelDetailRecord = NonNullable<
  Awaited<ReturnType<typeof getPublicHostelDetail>>
>;

export function projectPublicHostelDetail(hostel: PublicHostelDetailRecord) {
  return {
    id: hostel.id,
    slug: hostel.slug,
    name: hostel.name,
    city: hostel.city,
    area: hostel.area,
    description: hostel.description,
    amenities: hostel.amenities,
    pricePerMonth: hostel.pricePerMonth,
    gender: hostel.gender,
    rooms: hostel.rooms,
    capacity: hostel.capacity,
    minStay: hostel.minStay,
    maxStay: hostel.maxStay,
    cancellationPolicy: hostel.cancellationPolicy,
    images: hostel.images,
    coverImage: hostel.coverImage,
    verified: hostel.verified,
    rating: hostel.rating,
    reviewCount: hostel.reviewCount,
    latitude: hostel.latitude,
    longitude: hostel.longitude,
    owner: {
      name: hostel.owner.name,
      avatar: hostel.owner.avatar,
      bio: hostel.owner.bio,
      city: hostel.owner.city,
      createdAt: hostel.owner.createdAt,
      hostResponseSummary: hostel.owner.hostResponseSummary,
    },
    rooms_rel: hostel.rooms_rel.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      pricePerMonth: room.pricePerMonth,
      capacity: room.capacity,
      images: room.images,
    })),
    reviews: hostel.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      cleanliness: review.cleanliness,
      location: review.location,
      value: review.value,
      safety: review.safety,
      ownerReply: review.ownerReply,
      createdAt: review.createdAt,
      verified: review.verified,
      user: { name: review.user.name, avatar: review.user.avatar },
    })),
    reviewCategoryRatings: hostel.reviewCategoryRatings,
  };
}
