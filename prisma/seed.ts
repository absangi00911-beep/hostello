import { PrismaClient, Gender, HostelStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123456", 12);
  await db.user.upsert({
    where: { email: "admin@hostello.pk" },
    update: {},
    create: {
      email: "admin@hostello.pk",
      password: adminPassword,
      name: "HostelLo Admin",
      role: "ADMIN",
    },
  });

  // Create two hostel owners
  const ownerPassword = await hash("owner123456", 12);

  const owner1 = await db.user.upsert({
    where: { email: "ali.raza@hostello.pk" },
    update: {},
    create: {
      email: "ali.raza@hostello.pk",
      password: ownerPassword,
      name: "Ali Raza",
      phone: "+92-300-1234567",
      role: "OWNER",
      city: "Lahore",
    },
  });

  const owner2 = await db.user.upsert({
    where: { email: "sara.khan@hostello.pk" },
    update: {},
    create: {
      email: "sara.khan@hostello.pk",
      password: ownerPassword,
      name: "Sara Khan",
      phone: "+92-311-9876543",
      role: "OWNER",
      city: "Islamabad",
    },
  });

  // Create student users
  const studentPassword = await hash("student123456", 12);

  const student1 = await db.user.upsert({
    where: { email: "hamza@hostello.pk" },
    update: {},
    create: {
      email: "hamza@hostello.pk",
      password: studentPassword,
      name: "Hamza Malik",
      role: "STUDENT",
      city: "Lahore",
    },
  });

  // Create hostels
  const hostelData = [
    {
      name: "Green Valley Boys Hostel",
      slug: "green-valley-boys-hostel",
      description:
        "A well-maintained hostel in the heart of Gulberg, walking distance from University of Punjab. Separate study rooms, fast Wi-Fi, and home-cooked meals included. 24/7 CCTV and a gate guard keep things secure.",
      city: "Lahore",
      area: "Gulberg III",
      address: "12-B, Main Boulevard, Gulberg III, Lahore",
      latitude: 31.5204,
      longitude: 74.3587,
      pricePerMonth: 8500,
      rooms: 20,
      capacity: 60,
      gender: Gender.MALE,
      amenities: [
        "wifi",
        "meals",
        "laundry",
        "study-room",
        "cctv",
        "generator",
        "water-cooler",
        "parking",
      ],
      rules: [
        "No guests after 10pm",
        "No smoking inside rooms",
        "Quiet hours 11pm–6am",
        "Advance deposit required",
      ],
      images: [
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      ],
      coverImage:
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
      verified: true,
      featured: true,
      rating: 4.6,
      reviewCount: 24,
      ownerId: owner1.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Sitara Girls Residency",
      slug: "sitara-girls-residency",
      description:
        "Safe, comfortable accommodation for female students near Lahore College for Women University. All rooms have attached baths. Meals, laundry, and a rooftop lounge included. Female staff only.",
      city: "Lahore",
      area: "Jail Road",
      address: "45, Garden Town, Jail Road, Lahore",
      latitude: 31.531,
      longitude: 74.3405,
      pricePerMonth: 10000,
      rooms: 15,
      capacity: 30,
      gender: Gender.FEMALE,
      amenities: [
        "wifi",
        "meals",
        "laundry",
        "attached-bath",
        "ac",
        "cctv",
        "female-staff",
        "rooftop",
      ],
      rules: [
        "Female residents and visitors only",
        "Gate closes at 9pm",
        "No outside food in rooms",
        "Monthly rent due by 5th",
      ],
      images: [
        "https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=800&q=80",
        "https://images.unsplash.com/photo-1589834390005-5d4d9a0a5d3a?w=800&q=80",
      ],
      coverImage:
        "https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=800&q=80",
      verified: true,
      featured: true,
      rating: 4.8,
      reviewCount: 31,
      ownerId: owner1.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Capital View Hostel",
      slug: "capital-view-hostel",
      description:
        "Affordable, clean hostel near COMSATS University Islamabad. Both single and shared rooms available. Courtyard, fast fiber internet, and a small gym. Mixed occupancy with separate floors for men and women.",
      city: "Islamabad",
      area: "F-8",
      address: "Plot 7, Street 12, F-8/3, Islamabad",
      latitude: 33.7077,
      longitude: 73.0513,
      pricePerMonth: 11000,
      rooms: 25,
      capacity: 50,
      gender: Gender.MIXED,
      amenities: [
        "wifi",
        "gym",
        "meals",
        "generator",
        "cctv",
        "study-room",
        "courtyard",
        "elevator",
      ],
      rules: [
        "Separate floors for male and female residents",
        "Visitor timings: 10am–8pm",
        "No loud music after 10pm",
      ],
      images: [
        "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=800&q=80",
        "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80",
      ],
      coverImage:
        "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=800&q=80",
      verified: true,
      featured: false,
      rating: 4.3,
      reviewCount: 18,
      ownerId: owner2.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Blue Pines Boys Hostel",
      slug: "blue-pines-boys-hostel",
      description:
        "Budget-friendly hostel near NUST, popular with engineering students. Basic facilities, reliable Wi-Fi, and a supportive study environment. Discounts available for semester bookings.",
      city: "Islamabad",
      area: "H-12",
      address: "House 3, Street 5, H-12/1, Islamabad",
      latitude: 33.6843,
      longitude: 72.9776,
      pricePerMonth: 7500,
      rooms: 18,
      capacity: 45,
      gender: Gender.MALE,
      amenities: [
        "wifi",
        "study-room",
        "water-cooler",
        "cctv",
        "generator",
        "laundry",
      ],
      rules: [
        "No non-residents after 11pm",
        "Advance payment of one month required",
        "Keep common areas clean",
      ],
      images: [
        "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=800&q=80",
      ],
      coverImage:
        "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=800&q=80",
      verified: false,
      featured: false,
      rating: 4.1,
      reviewCount: 9,
      ownerId: owner2.id,
      status: HostelStatus.ACTIVE,
    },
  ];

  for (const data of hostelData) {
    await db.hostel.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }

  // Seed a review
  const greenValley = await db.hostel.findUnique({
    where: { slug: "green-valley-boys-hostel" },
  });

  if (greenValley) {
    await db.review.upsert({
      where: { hostelId_userId: { hostelId: greenValley.id, userId: student1.id } },
      update: {},
      create: {
        hostelId: greenValley.id,
        userId: student1.id,
        rating: 5,
        title: "Solid place, no complaints",
        comment:
          "Stayed here for two semesters. The meals are decent, Wi-Fi works well during exams, and the staff are responsive. It's not fancy but it's clean and safe. Would recommend to any LUMS or PU student.",
        cleanliness: 5,
        location: 5,
        value: 4,
        safety: 5,
        verified: true,
      },
    });
  }

  console.log(`Seeded:
  - ${hostelData.length} hostels
  - 3 users (admin, 2 owners, 1 student)
  - 1 review
  `);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
