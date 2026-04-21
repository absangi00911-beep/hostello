import { PrismaClient, Gender, HostelStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // ─── Users ────────────────────────────────────────────────────────────────

  const adminPassword  = await hash("admin123456",   12);
  const ownerPassword  = await hash("owner123456",   12);
  const studentPassword = await hash("student123456", 12);

  await db.user.upsert({
    where: { email: "admin@hostello.pk" },
    update: {},
    create: {
      email: "admin@hostello.pk",
      password: adminPassword,
      name: "HostelLo Admin",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

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
      emailVerified: new Date(),
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
      emailVerified: new Date(),
    },
  });

  const owner3 = await db.user.upsert({
    where: { email: "hassan.mirza@hostello.pk" },
    update: {},
    create: {
      email: "hassan.mirza@hostello.pk",
      password: ownerPassword,
      name: "Hassan Mirza",
      phone: "+92-321-5554321",
      role: "OWNER",
      city: "Karachi",
      emailVerified: new Date(),
    },
  });

  const owner4 = await db.user.upsert({
    where: { email: "amna.sheikh@hostello.pk" },
    update: {},
    create: {
      email: "amna.sheikh@hostello.pk",
      password: ownerPassword,
      name: "Amna Sheikh",
      phone: "+92-333-7778899",
      role: "OWNER",
      city: "Faisalabad",
      emailVerified: new Date(),
    },
  });

  const student1 = await db.user.upsert({
    where: { email: "hamza@hostello.pk" },
    update: {},
    create: {
      email: "hamza@hostello.pk",
      password: studentPassword,
      name: "Hamza Malik",
      role: "STUDENT",
      city: "Lahore",
      emailVerified: new Date(),
    },
  });

  // ─── Hostels ─────────────────────────────────────────────────────────────
  // NOTE: rating and reviewCount are intentionally omitted (default 0).
  // They are denormalized fields recomputed by the review API whenever a
  // review is submitted. Hard-coding non-zero values here would create
  // phantom ratings with no real reviews backing them.

  const hostelData = [
    // ── LAHORE ──────────────────────────────────────────────────────────────
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
      amenities: ["wifi", "meals", "laundry", "study-room", "cctv", "generator", "water-cooler", "parking"],
      rules: ["No guests after 10pm", "No smoking inside rooms", "Quiet hours 11pm–6am", "Advance deposit required"],
      images: [
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
      verified: true,
      featured: true,
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
      amenities: ["wifi", "meals", "laundry", "attached-bath", "ac", "cctv", "female-staff", "rooftop"],
      rules: ["Female residents and visitors only", "Gate closes at 9pm", "No outside food in rooms", "Monthly rent due by 5th"],
      images: [
        "https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=800&q=80",
        "https://images.unsplash.com/photo-1589834390005-5d4d9a0a5d3a?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=800&q=80",
      verified: true,
      featured: true,
      ownerId: owner1.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Al-Noor Boys Hostel",
      slug: "al-noor-boys-hostel",
      description:
        "Popular among UET Lahore and FAST students, Al-Noor sits just 10 minutes from both campuses. Double and triple rooms available. Fiber internet, a generator, and a large study hall make it ideal during exams.",
      city: "Lahore",
      area: "Canal Road",
      address: "22-C, Faisal Town, Canal Road, Lahore",
      latitude: 31.5089,
      longitude: 74.3224,
      pricePerMonth: 7200,
      rooms: 18,
      capacity: 54,
      gender: Gender.MALE,
      amenities: ["wifi", "fiber", "study-room", "generator", "cctv", "water-cooler", "laundry"],
      rules: ["No non-residents after 11pm", "Lights out in common areas by midnight", "Keep corridors clean"],
      images: [
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
      verified: true,
      featured: false,
      ownerId: owner1.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Fatima Women's Hostel",
      slug: "fatima-womens-hostel",
      description:
        "A trusted name near GCU Lahore and Kinnaird College. Fatima Women's Hostel offers clean single and shared rooms with attached bathrooms, three meals a day, and round-the-clock female security staff.",
      city: "Lahore",
      area: "Kachehri Road",
      address: "7, Cooper Road, Kachehri Road, Lahore",
      latitude: 31.5647,
      longitude: 74.3217,
      pricePerMonth: 9000,
      rooms: 12,
      capacity: 24,
      gender: Gender.FEMALE,
      amenities: ["wifi", "meals", "attached-bath", "cctv", "female-staff", "hot-water", "generator"],
      rules: ["Curfew at 9pm", "Visitors allowed in common room only", "No cooking in rooms"],
      images: [
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80",
      verified: false,
      featured: false,
      ownerId: owner1.id,
      status: HostelStatus.ACTIVE,
    },
    // ── ISLAMABAD ────────────────────────────────────────────────────────────
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
      amenities: ["wifi", "gym", "meals", "generator", "cctv", "study-room", "courtyard", "elevator"],
      rules: ["Separate floors for male and female residents", "Visitor timings: 10am–8pm", "No loud music after 10pm"],
      images: [
        "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=800&q=80",
        "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=800&q=80",
      verified: true,
      featured: false,
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
      amenities: ["wifi", "study-room", "water-cooler", "cctv", "generator", "laundry"],
      rules: ["No non-residents after 11pm", "Advance payment of one month required", "Keep common areas clean"],
      images: [
        "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=800&q=80",
      verified: false,
      featured: false,
      ownerId: owner2.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Margalla View Hostel",
      slug: "margalla-view-hostel",
      description:
        "A premium hostel in G-9 with sweeping Margalla Hills views, ideal for QAU and IIUI students. Fully air-conditioned rooms, attached baths, and a rooftop terrace. Limited seats available.",
      city: "Islamabad",
      area: "G-9",
      address: "House 14, Block G-9/3, Islamabad",
      latitude: 33.6938,
      longitude: 73.0382,
      pricePerMonth: 13500,
      rooms: 10,
      capacity: 20,
      gender: Gender.MIXED,
      amenities: ["wifi", "fiber", "ac", "attached-bath", "rooftop", "cctv", "meals", "gym"],
      rules: ["Strictly no guests in rooms", "Separate entrances for male and female residents", "Rent due by 1st of each month"],
      images: [
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
      verified: true,
      featured: true,
      ownerId: owner2.id,
      status: HostelStatus.ACTIVE,
    },
    // ── KARACHI ──────────────────────────────────────────────────────────────
    {
      name: "Karachi Central Boys Hostel",
      slug: "karachi-central-boys-hostel",
      description:
        "Strategically located near University of Karachi and NED University. Spacious rooms, reliable power backup, and a canteen on site. Monthly packages with meals available.",
      city: "Karachi",
      area: "University Road",
      address: "Plot 35, University Road, Karachi",
      latitude: 24.9407,
      longitude: 67.1115,
      pricePerMonth: 6500,
      rooms: 30,
      capacity: 90,
      gender: Gender.MALE,
      amenities: ["wifi", "meals", "generator", "cctv", "study-room", "water-cooler", "parking"],
      rules: ["Entry ID required at gate", "No valuables left unattended", "Quiet hours after midnight"],
      images: [
        "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80",
      verified: true,
      featured: false,
      ownerId: owner3.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Defence Girls Hostel",
      slug: "defence-girls-hostel",
      description:
        "Premium women's hostel in DHA Phase 2, close to IBA Karachi and Aga Khan University. Private and semi-private rooms with en-suite bathrooms. Meals, laundry, and 24/7 security included.",
      city: "Karachi",
      area: "DHA Phase 2",
      address: "Bungalow 12, 4th Lane, DHA Phase 2, Karachi",
      latitude: 24.8125,
      longitude: 67.0640,
      pricePerMonth: 14000,
      rooms: 8,
      capacity: 16,
      gender: Gender.FEMALE,
      amenities: ["wifi", "meals", "attached-bath", "ac", "cctv", "female-staff", "laundry", "hot-water"],
      rules: ["Residents only — no visitors allowed in rooms", "Gate closes at 10pm", "Monthly rent strictly in advance"],
      images: [
        "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80",
      verified: true,
      featured: false,
      ownerId: owner3.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Gulshan Boys Hostel",
      slug: "gulshan-boys-hostel",
      description:
        "Affordable shared accommodation in Gulshan-e-Iqbal, 5 minutes from FAST-NU Karachi. Triple rooms with bunk beds keep costs low. Common kitchen, fast Wi-Fi, and UPS backup included.",
      city: "Karachi",
      area: "Gulshan-e-Iqbal",
      address: "Block 13-C, Gulshan-e-Iqbal, Karachi",
      latitude: 24.9215,
      longitude: 67.0954,
      pricePerMonth: 5500,
      rooms: 20,
      capacity: 60,
      gender: Gender.MALE,
      amenities: ["wifi", "kitchen", "generator", "cctv", "study-room", "water-cooler"],
      rules: ["No smoking on premises", "Shared kitchen usage by roster", "Monthly payment required upfront"],
      images: [
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
      verified: false,
      featured: false,
      ownerId: owner3.id,
      status: HostelStatus.ACTIVE,
    },
    // ── FAISALABAD ───────────────────────────────────────────────────────────
    {
      name: "Agri Students Hostel",
      slug: "agri-students-hostel",
      description:
        "The most popular hostel near University of Agriculture Faisalabad. Home-style meals, a large study hall, and a garden courtyard. Long-stay discounts available for semester bookings.",
      city: "Faisalabad",
      area: "Jaranwala Road",
      address: "113-B, Jaranwala Road, Faisalabad",
      latitude: 31.4733,
      longitude: 73.1012,
      pricePerMonth: 5500,
      rooms: 22,
      capacity: 66,
      gender: Gender.MALE,
      amenities: ["wifi", "meals", "study-room", "courtyard", "generator", "water-cooler", "laundry"],
      rules: ["Study hours enforced 8pm–10pm", "Noise curfew after 11pm", "One month advance required"],
      images: [
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      verified: true,
      featured: false,
      ownerId: owner4.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "City Girls Hostel Faisalabad",
      slug: "city-girls-hostel-faisalabad",
      description:
        "Safe, well-managed women's hostel near GCU Faisalabad and UET Faisalabad campuses. AC rooms, attached bathrooms, and in-house meals. Female warden on duty 24 hours.",
      city: "Faisalabad",
      area: "Gulberg Colony",
      address: "37, Green Town, Gulberg Colony, Faisalabad",
      latitude: 31.4617,
      longitude: 73.0891,
      pricePerMonth: 6200,
      rooms: 14,
      capacity: 28,
      gender: Gender.FEMALE,
      amenities: ["wifi", "meals", "ac", "attached-bath", "cctv", "female-staff", "hot-water", "generator"],
      rules: ["Female residents only", "Curfew at 9pm weekdays, 10pm weekends", "No non-relatives allowed inside"],
      images: [
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbe?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbe?w=800&q=80",
      verified: false,
      featured: false,
      ownerId: owner4.id,
      status: HostelStatus.ACTIVE,
    },
    // ── MULTAN ───────────────────────────────────────────────────────────────
    {
      name: "BZU Scholar Hostel",
      slug: "bzu-scholar-hostel",
      description:
        "Steps away from Bahauddin Zakariya University's main gate. BZU Scholar Hostel offers some of Multan's most affordable rooms with three meals, a study hall, and uninterrupted power.",
      city: "Multan",
      area: "Bosan Road",
      address: "University Chowk, Bosan Road, Multan",
      latitude: 30.1618,
      longitude: 71.4925,
      pricePerMonth: 5000,
      rooms: 25,
      capacity: 75,
      gender: Gender.MALE,
      amenities: ["wifi", "meals", "study-room", "generator", "water-cooler", "cctv"],
      rules: ["Study period 9pm–11pm strictly enforced", "Lights out in dorms by 11:30pm", "Advance of one month required"],
      images: [
        "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
      verified: true,
      featured: false,
      ownerId: owner4.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Royal Girls Hostel Multan",
      slug: "royal-girls-hostel-multan",
      description:
        "A clean, affordable option for female students near NFC IET and BZU. Shared and private rooms with meals included. Lady warden resident on-site.",
      city: "Multan",
      area: "Shah Rukn-e-Alam Colony",
      address: "Block D, Shah Rukn-e-Alam Colony, Multan",
      latitude: 30.1935,
      longitude: 71.4683,
      pricePerMonth: 6000,
      rooms: 10,
      capacity: 20,
      gender: Gender.FEMALE,
      amenities: ["wifi", "meals", "rooftop", "cctv", "female-staff", "generator", "water-cooler"],
      rules: ["Entry for female visitors only", "Gate locks at 9pm", "No cooking in rooms"],
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80",
      verified: false,
      featured: false,
      ownerId: owner4.id,
      status: HostelStatus.ACTIVE,
    },
    // ── PESHAWAR ─────────────────────────────────────────────────────────────
    {
      name: "Scholar Boys Hostel Peshawar",
      slug: "scholar-boys-hostel-peshawar",
      description:
        "Located near UET Peshawar and the University of Peshawar. Scholar Boys Hostel is one of the few hostels in the city with fiber internet and a dedicated exam preparation room.",
      city: "Peshawar",
      area: "University Campus Road",
      address: "Near UET Gate 2, University Road, Peshawar",
      latitude: 34.0102,
      longitude: 71.4956,
      pricePerMonth: 6500,
      rooms: 20,
      capacity: 60,
      gender: Gender.MALE,
      amenities: ["wifi", "fiber", "meals", "study-room", "generator", "cctv", "water-cooler"],
      rules: ["Gate closes at 11pm", "No political activities on premises", "Study hall strictly for studying"],
      images: [
        "https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80",
      verified: true,
      featured: false,
      ownerId: owner2.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Hayatabad Girls Hostel",
      slug: "hayatabad-girls-hostel",
      description:
        "A safe, family-run women's hostel in the residential Phase 5 of Hayatabad. Well-connected to KMU and Women University Peshawar by public transport.",
      city: "Peshawar",
      area: "Hayatabad Phase 5",
      address: "Street 4, Phase 5, Hayatabad, Peshawar",
      latitude: 34.0026,
      longitude: 71.4295,
      pricePerMonth: 7000,
      rooms: 10,
      capacity: 20,
      gender: Gender.FEMALE,
      amenities: ["wifi", "meals", "ac", "cctv", "female-staff", "generator", "hot-water"],
      rules: ["Female residents only", "Curfew strictly 9pm", "Advance rent required before move-in"],
      images: [
        "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80",
      verified: false,
      featured: false,
      ownerId: owner2.id,
      status: HostelStatus.ACTIVE,
    },
    // ── RAWALPINDI ───────────────────────────────────────────────────────────
    {
      name: "Pindi Boys Hostel",
      slug: "pindi-boys-hostel",
      description:
        "Conveniently placed near PMAS Arid Agriculture University and Bahria University. Pindi Boys Hostel offers three meals a day, laundry service, generator backup, and a ground floor study room open 24 hours.",
      city: "Rawalpindi",
      area: "Murree Road",
      address: "House 9, Noor Road, Murree Road, Rawalpindi",
      latitude: 33.5961,
      longitude: 73.0551,
      pricePerMonth: 7000,
      rooms: 18,
      capacity: 54,
      gender: Gender.MALE,
      amenities: ["wifi", "meals", "laundry", "study-room", "generator", "cctv", "parking"],
      rules: ["Visitors allowed 10am–8pm in common room only", "No smoking", "Rent due by 5th of month"],
      images: [
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
      verified: false,
      featured: false,
      ownerId: owner2.id,
      status: HostelStatus.ACTIVE,
    },
    {
      name: "Satellite Town Girls Hostel",
      slug: "satellite-town-girls-hostel",
      description:
        "Established women's hostel in Satellite Town, popular with Foundation University and UAAR students. Well-lit rooms, three meals, and a reliable lady warden.",
      city: "Rawalpindi",
      area: "Satellite Town",
      address: "Block A, Satellite Town, Rawalpindi",
      latitude: 33.5768,
      longitude: 73.0399,
      pricePerMonth: 8000,
      rooms: 12,
      capacity: 24,
      gender: Gender.FEMALE,
      amenities: ["wifi", "meals", "cctv", "female-staff", "generator", "hot-water", "parking"],
      rules: ["Female only — no male visitors", "Curfew 9pm", "Two months security deposit on joining"],
      images: [
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
      verified: true,
      featured: false,
      ownerId: owner2.id,
      status: HostelStatus.ACTIVE,
    },
    // ── QUETTA ───────────────────────────────────────────────────────────────
    {
      name: "Baloch Scholars Hostel",
      slug: "baloch-scholars-hostel",
      description:
        "One of the few purpose-built student hostels in Quetta, close to the University of Balochistan and Bolan Medical College. Warm rooms for the cold winters, meals included, and a dedicated study hall.",
      city: "Quetta",
      area: "Sariab Road",
      address: "Near UoB Gate, Sariab Road, Quetta",
      latitude: 30.1798,
      longitude: 67.0099,
      pricePerMonth: 5800,
      rooms: 20,
      capacity: 60,
      gender: Gender.MALE,
      amenities: ["wifi", "meals", "study-room", "generator", "water-cooler", "cctv"],
      rules: ["Gate closes at 10pm", "Advance one month rent required", "Keep common areas tidy"],
      images: [
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
      ],
      coverImage: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
      verified: false,
      featured: false,
      ownerId: owner4.id,
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

  // ─── One real review for Green Valley ────────────────────────────────────
  // This is the ONLY review seeded. rating/reviewCount on the hostel row
  // are updated atomically by the review API — run this after seeding if you
  // want them reflected immediately, or they'll update on the next real review.

  const greenValley = await db.hostel.findUnique({
    where: { slug: "green-valley-boys-hostel" },
    select: { id: true },
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

    // Recompute the denormalized rating/reviewCount on the hostel row
    // so the listing reflects the real review immediately after seeding.
    const agg = await db.review.aggregate({
      where: { hostelId: greenValley.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await db.hostel.update({
      where: { id: greenValley.id },
      data: {
        rating: agg._avg.rating ?? 0,
        reviewCount: agg._count.rating,
      },
    });
  }

  console.log(`\nSeeded:
  - ${hostelData.length} hostels across 8 cities
  - 5 users (1 admin, 3 owners, 1 student) — all with verified emails
  - 1 real review (Green Valley — rating recomputed from actual data)
  `);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());