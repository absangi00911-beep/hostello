export function formatPrice(amount: number, currency = "PKR"): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    // "PKR 7,000" rather than the en-PK locale symbol "Rs 7,000", so prices read
    // the same across the marketplace, checkout, dashboards and emails.
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}
