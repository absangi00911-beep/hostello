import { serializeJsonLd } from "@/lib/serialize-json-ld";

/** Renders structured data. `serializeJsonLd` escapes `<` so text cannot close the tag. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
