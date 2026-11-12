// Offline weak-password check. No network call, no personal data involved.
//
// The password rules (8+ characters, an uppercase letter, a number) are easy to satisfy
// with the most guessed passwords ("Password1", "Welcome123", "Lahore2024"). This rejects
// those by comparing the lowercased password, with common look-alike characters folded,
// against a list of very common bases, ignoring trailing digits and symbols.

/** Very common passwords and words people build passwords from (lowercase letters only). */
const COMMON_BASES = new Set([
  "password", "passwd", "welcome", "letmein", "iloveyou", "admin", "administrator", "login",
  "qwerty", "qwertyuiop", "qwertyui", "asdfghjkl", "asdfgh", "zxcvbnm", "azerty", "abcdefgh",
  "abcdefg", "abcdef", "monkey", "dragon", "master", "shadow", "sunshine", "princess",
  "football", "baseball", "basketball", "cricket", "superman", "batman", "spiderman",
  "starwars", "pokemon", "naruto", "minecraft", "freedom", "whatever", "trustno",
  "changeme", "default", "secret", "guest", "test", "testing", "temp", "temporary",
  "hello", "helloworld", "computer", "internet", "google", "facebook", "whatsapp",
  "instagram", "youtube", "samsung", "iphone", "android", "windows", "student", "students",
  "university", "college", "hostel", "hostello", "hostelo", "hostelhub", "boarding",
  "pakistan", "pakistani", "islamabad", "lahore", "karachi", "peshawar", "quetta",
  "rawalpindi", "faisalabad", "multan", "sialkot", "hyderabad", "punjab", "sindh",
  "allah", "bismillah", "mashallah", "inshallah", "muhammad", "mohammad", "ahmed", "ahmad",
  "ali", "hassan", "hussain", "fatima", "ayesha", "jannat", "ramzan", "madina", "makkah",
  "lovely", "forever", "family", "friends", "friend", "mother", "father", "brother",
  "sister", "angel", "baby", "honey", "sweety", "cutie", "flower", "butterfly", "rainbow",
  "summer", "winter", "spring", "autumn", "monday", "friday", "sunday", "january",
  "december", "america", "england", "london", "canada", "dubai", "mustang", "ferrari",
  "mercedes", "toyota", "honda", "yamaha", "michael", "jordan", "jessica", "ashley",
  "daniel", "thomas", "charlie", "robert", "jennifer", "hunter", "tigger", "soccer",
  "hockey", "killer", "ninja", "pepper", "ranger", "harley", "buster", "cookie",
]);

/** Common passwords that contain digits, matched as a whole. */
const COMMON_EXACT = new Set([
  "12345678", "123456789", "1234567890", "11111111", "00000000", "87654321", "12341234",
  "123123123", "1q2w3e4r", "1q2w3e4r5t", "qwerty123", "qwerty12", "abc12345", "abcd1234",
  "a1b2c3d4", "password1", "pass1234", "admin123", "welcome1", "iloveyou1", "letmein1",
  "zaq12wsx", "q1w2e3r4", "1qaz2wsx", "123qweasd", "1234qwer", "qwer1234", "asdf1234",
  "aaaa1111", "a1234567", "a12345678", "pakistan1", "lahore123", "karachi123",
]);

const LOOK_ALIKES: Record<string, string> = {
  "@": "a",
  "4": "a",
  "3": "e",
  "1": "i",
  "!": "i",
  "0": "o",
  "$": "s",
  "5": "s",
  "7": "t",
};

function foldLookAlikes(value: string): string {
  return Array.from(value, (char) => LOOK_ALIKES[char] ?? char).join("");
}

function stripTrailingNonLetters(value: string): string {
  return value.replace(/[^a-z]+$/u, "");
}

/**
 * True for passwords that are among the most guessed: a common password or word,
 * optionally with digits or symbols on the end or look-alike substitutions
 * ("P@ssw0rd!", "Welcome2026"), or one that is only one or two distinct characters.
 */
export function isCommonPassword(password: string): boolean {
  const lower = password.trim().toLowerCase();
  if (lower.length === 0) return false;
  if (new Set(lower).size <= 2) return true;

  // Strip trailing digits/symbols from the raw text first: folding would turn a trailing
  // "!" or "1" into a letter and hide the base word ("P@ssw0rd!" -> "p@ssw0rd" -> "password").
  const wholeCandidates = [lower, foldLookAlikes(lower)];
  const baseCandidates = [
    foldLookAlikes(stripTrailingNonLetters(lower)),
    stripTrailingNonLetters(foldLookAlikes(lower)),
  ];

  return (
    wholeCandidates.some((candidate) => COMMON_EXACT.has(candidate)) ||
    baseCandidates.some((base) => base.length > 0 && COMMON_BASES.has(base))
  );
}
