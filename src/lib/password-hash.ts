// Path: src/lib/password-hash.ts

/**
 * bcrypt work factor for every password hash the app creates (signup, reset, change).
 * Raise it here, in one place, as hardware gets faster. Existing hashes keep their own
 * cost, which bcrypt embeds in the hash, so `compare` keeps working across a change.
 */
export const BCRYPT_COST = 12;
