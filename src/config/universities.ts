export interface University {
  name: string;
  shortName: string;
  city: string;
  area?: string;
}

export const UNIVERSITIES: University[] = [
  // Lahore
  { name: "Lahore University of Management Sciences", shortName: "LUMS", city: "Lahore", area: "DHA Phase 5" },
  { name: "University of Engineering and Technology Lahore", shortName: "UET Lahore", city: "Lahore", area: "Gulberg III" },
  { name: "University of Punjab", shortName: "PU", city: "Lahore", area: "Quaid-e-Azam Campus" },
  { name: "Lahore College for Women University", shortName: "LCWU", city: "Lahore", area: "Jail Road" },
  { name: "Government College University Lahore", shortName: "GCU Lahore", city: "Lahore", area: "Kachehri Road" },
  { name: "Kinnaird College for Women", shortName: "Kinnaird", city: "Lahore", area: "Jail Road" },
  { name: "Forman Christian College", shortName: "FC College", city: "Lahore", area: "Zahoor Elahi Road" },
  { name: "University of Management and Technology", shortName: "UMT", city: "Lahore", area: "Johar Town" },
  { name: "FAST-NU Lahore", shortName: "FAST Lahore", city: "Lahore", area: "Faisal Town" },

  // Islamabad
  { name: "National University of Sciences and Technology", shortName: "NUST", city: "Islamabad", area: "H-12" },
  { name: "COMSATS University Islamabad", shortName: "COMSATS", city: "Islamabad", area: "F-8" },
  { name: "Quaid-i-Azam University", shortName: "QAU", city: "Islamabad", area: "H-7" },
  { name: "International Islamic University Islamabad", shortName: "IIUI", city: "Islamabad", area: "H-10" },
  { name: "Air University", shortName: "AU", city: "Islamabad", area: "E-9" },
  { name: "FAST-NU Islamabad", shortName: "FAST Islamabad", city: "Islamabad", area: "A-7" },

  // Karachi
  { name: "University of Karachi", shortName: "KU", city: "Karachi", area: "University Road" },
  { name: "NED University of Engineering and Technology", shortName: "NED", city: "Karachi", area: "University Road" },
  { name: "Aga Khan University", shortName: "AKU", city: "Karachi", area: "Stadium Road" },
  { name: "Institute of Business Administration Karachi", shortName: "IBA Karachi", city: "Karachi", area: "Garden" },
  { name: "FAST-NU Karachi", shortName: "FAST Karachi", city: "Karachi", area: "Gulshan-e-Iqbal" },

  // Faisalabad
  { name: "University of Agriculture Faisalabad", shortName: "UAF", city: "Faisalabad" },
  { name: "Government College University Faisalabad", shortName: "GCU Faisalabad", city: "Faisalabad" },
  { name: "University of Engineering and Technology Faisalabad", shortName: "UET Faisalabad", city: "Faisalabad" },

  // Multan
  { name: "Bahauddin Zakariya University", shortName: "BZU", city: "Multan" },
  { name: "NFC Institute of Engineering and Fertilizer Research", shortName: "NFC IET", city: "Multan" },

  // Peshawar
  { name: "University of Engineering and Technology Peshawar", shortName: "UET Peshawar", city: "Peshawar" },
  { name: "University of Peshawar", shortName: "UoP", city: "Peshawar" },
  { name: "Khyber Medical University", shortName: "KMU", city: "Peshawar" },

  // Rawalpindi
  { name: "PMAS Arid Agriculture University Rawalpindi", shortName: "UAAR", city: "Rawalpindi" },
  { name: "Foundation University Rawalpindi", shortName: "FUI", city: "Rawalpindi" },
  { name: "Bahria University Islamabad", shortName: "Bahria University", city: "Rawalpindi" },

  // Quetta
  { name: "University of Balochistan", shortName: "UoB", city: "Quetta" },
  { name: "Balochistan University of Engineering and Technology", shortName: "BUET Khuzdar", city: "Quetta" },
];

// Shown as quick-link chips in the homepage hero
export const POPULAR_UNIVERSITIES: Pick<University, "shortName" | "city">[] = [
  { shortName: "NUST", city: "Islamabad" },
  { shortName: "LUMS", city: "Lahore" },
  { shortName: "UET Lahore", city: "Lahore" },
  { shortName: "COMSATS", city: "Islamabad" },
  { shortName: "KU", city: "Karachi" },
  { shortName: "BZU", city: "Multan" },
];