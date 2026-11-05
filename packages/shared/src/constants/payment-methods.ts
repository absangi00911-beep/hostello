export const ENABLED_PAYMENT_METHODS = ["safepay"] as const;

export function isEnabledPaymentMethod(
  value: string,
): value is (typeof ENABLED_PAYMENT_METHODS)[number] {
  return ENABLED_PAYMENT_METHODS.some((method) => method === value);
}
