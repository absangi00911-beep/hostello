/**
 * Serializes JSON-LD for an inline script element.
 * Escaping `<` prevents untrusted text from closing the HTML script element.
 */
export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new TypeError("JSON-LD value must be serializable");
  }

  return serialized.replace(/</g, "\\u003c");
}
