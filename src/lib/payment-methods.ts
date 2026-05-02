export const PAYMENT_METHODS = [
  {
    value: "safepay",
    label: "Card",
    emoji: "💳",
    enabled: true,
    hint: "Powered by Safepay",
  },
  {
    value: "jazzcash",
    label: "JazzCash",
    emoji: "📱",
    enabled: false,
    hint: "Mobile wallet",
  },
  {
    value: "easypaisa",
    label: "EasyPaisa",
    emoji: "📱",
    enabled: false,
    hint: "Mobile wallet",
  },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

export const DEFAULT_PAYMENT_METHOD =
  PAYMENT_METHODS.find((method) => method.enabled)?.value ?? "safepay";
