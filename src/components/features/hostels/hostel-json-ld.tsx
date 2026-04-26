import type { Hostel, Review, User } from "@prisma/client";

interface HostelJsonLdProps {
  hostel: Pick<Hostel, "name" | "description" | "address" | "city" | "latitude" | "longitude" | "pricePerMonth" | "rating" | "reviewCount" | "coverImage">;
  reviews?: (Review & { user: Pick<User, "name"> })[];
  url: string;
}

/**
 * Generate JSON-LD structured data for a hostel listing.
 * This helps Google understand and display rich results for accommodation searches.
 * Reference: https://schema.org/LodgingBusiness
 */
export function HostelJsonLd({ hostel, reviews = [], url }: HostelJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: hostel.name,
    description: hostel.description,
    url: url,
    image: hostel.coverImage || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: hostel.address,
      addressLocality: hostel.city,
      addressCountry: "PK",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: hostel.latitude,
      longitude: hostel.longitude,
    },
    ...(hostel.pricePerMonth && {
      priceRange: `PKR ${hostel.pricePerMonth}`,
    }),
    ...(hostel.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: hostel.rating.toFixed(1),
        ratingCount: hostel.reviewCount,
      },
    }),
    review: reviews.slice(0, 5).map((review) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
      },
      ...(review.title && { headline: review.title }),
      ...(review.comment && { reviewBody: review.comment }),
      author: {
        "@type": "Person",
        name: review.user.name,
      },
      datePublished: review.createdAt.toISOString().split("T")[0],
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
