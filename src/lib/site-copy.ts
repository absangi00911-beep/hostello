// Shared UI strings for the app shell and state pages. Kept in one place so
// a translation layer (Urdu) can replace them later without touching markup.
export const siteCopy = {
  brand: "HostelLo",
  footer: {
    navLabel: "Site",
    terms: "Terms",
    privacy: "Privacy",
    contact: "Contact",
    rights: "HostelLo",
  },
  states: {
    backToListings: "Back to listings",
    loading: "Loading…",
    errorTitle: "Something went wrong",
    errorBody:
      "We couldn't load this page. Please try again, or go back to the listings.",
    retry: "Try again",
    notFoundTitle: "We can't find that page",
    notFoundBody:
      "The page may have moved or no longer exists. Head back to the listings to keep looking.",
    hostelNotFoundTitle: "We can't find that hostel",
    hostelNotFoundBody:
      "This listing may have been removed or is no longer available.",
    bookingNotFoundTitle: "We can't find that booking",
    bookingNotFoundBody:
      "Check that you're signed in to the account that made the booking.",
  },
} as const;
