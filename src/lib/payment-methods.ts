// Path: src/lib/payment-methods.ts
import { isEnabledPaymentMethod } from "@hostello/shared";

const PAYMENT_METHOD_CATALOG = [
  {
    value: "safepay",
    label: "Card",
    emoji: "💳",
    hint: "Powered by Safepay",
  },
  {
    value: "jazzcash",
    label: "JazzCash",
    emoji: "📱",
    hint: "Mobile wallet",
  },
  {
    value: "easypaisa",
    label: "EasyPaisa",
    emoji: "📱",
    hint: "Mobile wallet",
  },
] as const;

export const PAYMENT_METHODS = PAYMENT_METHOD_CATALOG.map((method) => ({
  ...method,
  enabled: isEnabledPaymentMethod(method.value),
}));

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

export const DEFAULT_PAYMENT_METHOD =
  PAYMENT_METHODS.find((method) => method.enabled)?.value ?? "safepay";
