import { Gender, HostelStatus } from "../src/generated/enums";

const citySeedData = [
  {
    city: "Lahore",
    latitude: 31.5204,
    longitude: 74.3587,
    basePrice: 6500,
    areas: [
      "Model Town", "Johar Town", "DHA Phase 5", "Faisal Town", "Wapda Town",
      "Township", "Gulberg II", "Garden Town", "Muslim Town", "Valencia Town",
      "Iqbal Town", "Bahria Town", "Cavalry Ground", "Shadman", "Shadbagh",
    ],
  },
  {
    city: "Islamabad",
    latitude: 33.6844,
    longitude: 73.0479,
    basePrice: 8000,
    areas: [
      "G-10", "G-11", "I-8", "I-10", "E-11", "F-10", "G-13",
      "H-13", "I-9", "Blue Area", "Bahria Enclave", "G-6", "G-8", "F-11", "I-14",
    ],
  },
  {
    city: "Karachi",
    latitude: 24.8607,
    longitude: 67.0011,
    basePrice: 5500,
    areas: [
      "PECHS", "North Nazimabad", "Gulistan-e-Jauhar", "Clifton", "Bahadurabad",
      "Federal B Area", "Korangi", "Malir", "Tariq Road", "Saddar", "Scheme 33",
      "DHA Phase 6", "Nazimabad", "North Karachi", "Gulshan Block 7",
    ],
  },
  {
    city: "Faisalabad",
    latitude: 31.4504,
    longitude: 73.135,
    basePrice: 4500,
    areas: [
      "D Ground", "Madina Town", "Susan Road", "Peoples Colony", "Samanabad",
      "Jinnah Colony", "Millat Chowk", "Gulistan Colony", "Kohinoor City",
      "Satiana Road", "Canal Road", "FDA City", "Eden Valley", "Lasani Town",
      "Nishatabad",
    ],
  },
  {
    city: "Multan",
    latitude: 30.1575,
    longitude: 71.5249,
    basePrice: 4000,
    areas: [
      "New Multan", "Cantt", "Gulgasht Colony", "Mumtazabad", "Model Town",
      "Shah Shams Colony", "Wapda Town", "Chungi No 6", "BCG Chowk",
      "Buch Villas", "Zakariya Town", "Suraj Miani", "Vehari Road",
      "Hassan Parwana", "Bosan Town",
    ],
  },
  {
    city: "Peshawar",
    latitude: 34.0151,
    longitude: 71.5249,
    basePrice: 5000,
    areas: [
      "Hayatabad", "University Town", "University Road", "Saddar", "Tehkal Bala",
      "Board Bazaar", "Khyber Bazar", "Warsak Road", "Dabgari Gardens", "Gulbahar",
      "Charsadda Road", "Ring Road", "Regi Model Town", "Palosi", "Nothia",
    ],
  },
  {
    city: "Quetta",
    latitude: 30.1798,
    longitude: 66.975,
    basePrice: 4500,
    areas: [
      "Jinnah Town", "Samungli Road", "Satellite Town", "Brewery Road",
      "Sariab Road", "Model Town", "Airport Road", "Cantt", "Toghi Road",
      "Patel Road", "Zarghoon Road", "Kasi Road", "Chiltan Housing", "Wahdat Colony",
      "Alamdar Road",
    ],
  },
  {
    city: "Rawalpindi",
    latitude: 33.5651,
    longitude: 73.0169,
    basePrice: 5500,
    areas: [
      "Satellite Town", "Bahria Town", "Saddar", "Chaklala Scheme 3",
      "Commercial Market", "Peshawar Road", "Westridge", "Adyala Road",
      "Murree Road", "Gulraiz", "Askari 14", "Airport Housing Society",
      "Lalkurti", "Dhok Chaudhrian", "Scheme 3",
    ],
  },
] as const;

type SeedCity = (typeof citySeedData)[number]["city"];

export type SeedHostel = {
  name: string;
  slug: string;
  description: string;
  city: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerMonth: number;
  rooms: number;
  capacity: number;
  gender: Gender;
  amenities: string[];
  rules: string[];
  images: string[];
  coverImage: string;
  verified: boolean;
  featured: boolean;
  ownerId: string;
  status: HostelStatus;
};

const targetHostelsPerCity = 15;
const hostelImages = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
];

export function addMissingCityHostels(
  existingHostels: readonly { city: string }[],
  ownerIds: Record<SeedCity, string>,
): SeedHostel[] {
  const counts = new Map<string, number>();

  for (const hostel of existingHostels) {
    counts.set(hostel.city, (counts.get(hostel.city) ?? 0) + 1);
  }

  const configuredCities = new Set<string>(citySeedData.map(({ city }) => city));
  const unconfiguredCity = existingHostels.find(
    (hostel) => !configuredCities.has(hostel.city),
  );
  if (unconfiguredCity) {
    throw new Error(`Missing seed locations for ${unconfiguredCity.city}.`);
  }

  return citySeedData.flatMap((cityData) => {
    const ownerId = ownerIds[cityData.city];
    if (!ownerId) {
      throw new Error(`Missing seed owner for ${cityData.city}.`);
    }

    const missingCount = Math.max(
      0,
      targetHostelsPerCity - (counts.get(cityData.city) ?? 0),
    );

    if (missingCount > cityData.areas.length) {
      throw new Error(`Not enough seed areas for ${cityData.city}.`);
    }

    return Array.from({ length: missingCount }, (_, index) => {
      const area = cityData.areas[index];
      const gender = [Gender.MALE, Gender.FEMALE, Gender.MIXED][index % 3];
      const genderLabel =
        gender === Gender.MALE ? "Boys" : gender === Gender.FEMALE ? "Girls" : "Co-ed";
      const name = `${area} ${genderLabel} Hostel`;
      const row = Math.floor(index / 5);
      const column = index % 5;
      const coverImage = hostelImages[index % hostelImages.length];

      return {
        name,
        slug: `${cityData.city}-${area}-student-hostel`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        description: `${name} offers student accommodation in ${area}, ${cityData.city}, with shared rooms, Wi-Fi, and a study-friendly common area.`,
        city: cityData.city,
        area,
        address: `Student Accommodation Lane, ${area}, ${cityData.city}`,
        latitude: cityData.latitude + (row - 1) * 0.007 + (column - 2) * 0.0015,
        longitude: cityData.longitude + (column - 2) * 0.006 + (row - 1) * 0.004,
        pricePerMonth: cityData.basePrice + (index % 4) * 250,
        rooms: 10 + (index % 8),
        capacity: 30 + (index % 8) * 3,
        gender,
        amenities: ["wifi", "study-room", "laundry", "cctv"],
        rules: ["No smoking indoors", "Keep shared areas clean", "Monthly rent due in advance"],
        images: hostelImages,
        coverImage,
        verified: false,
        featured: false,
        ownerId,
        status: HostelStatus.ACTIVE,
      };
    });
  });
}
