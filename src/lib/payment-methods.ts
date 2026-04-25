export const PAYMENT_METHODS = [
  {
    value: "jazzcash",
    label: "JazzCash",
    emoji: "📱",
    enabled: false,
    hint: "Coming soon",
  },
  {
    value: "easypaisa",
    label: "EasyPaisa",
    emoji: "💚",
    enabled: false,
    hint: "Coming soon",
  },
  {
    value: "safepay",
    label: "Card",
    emoji: "💳",
    enabled: true,
    hint: "Powered by Safepay",
  },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

export const DEFAULT_PAYMENT_METHOD =
  PAYMENT_METHODS.find((method) => method.enabled)?.value ?? "safepay";
