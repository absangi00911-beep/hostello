---
version: 1
slug: "src-app-hostels-param-page-tsx"
primary_target: "src/app/hostels/[param]/page.tsx"
related_targets: ["src/app/globals.css","src/components/home/HostelRow.tsx","src/app/search/page.tsx"]
---

# Hostel detail page

Operate surface for students evaluating a hostel and starting a monthly booking. The page includes the listing title and photo gallery, a public-data overview with rating/verification, stay facts, amenities, and description, alongside the reservation card.

## Direction contract

THESIS: Put the real hostel and its photos first, then make the monthly reservation path immediately clear; refuse a marketing hero and fabricated listing claims.

OWN-WORLD: Inherit HostelLo’s white browse surface, dark ink, fine borders, and deep-green brand accents. Keep HostelLo identity; do not reproduce Airbnb branding, copy, or supplied photos.

STORY: Students inspect a real active listing, understand its location and monthly price, and can begin the existing booking and payment flow.

OVERVIEW: Use only public listing data. Show verified status and review aggregates when available, room/capacity/gender facts, and the host-written description. Follow with a "Where you’ll sleep" section for available room types using their own photos, descriptions, capacities, and monthly prices, then show listed amenities in a responsive icon grid. Follow the amenities with a two-month date calendar whose selected move-in/move-out range stays synchronized with the reservation form and respects monthly stay limits. Follow the calendar with actual guest reviews: the saved overall score and count, category averages from nonzero ratings, and up to six recent comments with verified-stay labels and host replies when present. Follow reviews with a full-width "Where you’ll be" section showing the listing's area and city, plus an OpenStreetMap embed with coordinates rounded to two decimal places. Never expose the exact address or precise coordinates publicly; when coordinates are missing or invalid, show a clear no-map state. Never invent reviews, scores, or availability. Do not expose owner profile fields through the public detail query.

FIRST VIEWPORT: Keep the HostelLo header. Place the hostel title and compact Share/Save actions above a five-photo mosaic: one large image on the left and four smaller images on the right. Below, align the listing summary left and monthly reservation card right; stack these regions on mobile.

FORM: User-approved, screenshot-guided listing gallery plus monthly reservation sidebar, adapted to HostelLo data and existing payment behavior. seed: none (precisely specified reference; no concept roll).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
