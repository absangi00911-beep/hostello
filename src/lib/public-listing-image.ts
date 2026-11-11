import sharp from "sharp";
import { MAX_IMAGE_SIZE_MB } from "@/config/constants";

export type PublicListingImageContentType = "image/jpeg" | "image/png" | "image/webp";

const FORMAT_BY_CONTENT_TYPE = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
} as const satisfies Record<PublicListingImageContentType, string>;

const MAX_OUTPUT_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_INPUT_PIXELS = 20_000_000;

export class PublicListingImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicListingImageError";
  }
}

export function isPublicListingImageContentType(
  value: string,
): value is PublicListingImageContentType {
  return Object.hasOwn(FORMAT_BY_CONTENT_TYPE, value);
}

export async function sanitizePublicListingImage(
  buffer: Buffer,
  contentType: PublicListingImageContentType,
): Promise<Buffer> {
  let output: Buffer;
  try {
    const result = await sharp(buffer, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .toFormat(FORMAT_BY_CONTENT_TYPE[contentType])
      .toBuffer({ resolveWithObject: true });
    output = result.data;
  } catch {
    throw new PublicListingImageError("Image content is invalid or could not be processed.");
  }

  if (output.byteLength > MAX_OUTPUT_BYTES) {
    throw new PublicListingImageError("Processed image exceeds the maximum size.");
  }

  return output;
}
