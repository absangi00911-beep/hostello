import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { PublicListingImageError, sanitizePublicListingImage } from "./public-listing-image";

describe("sanitizePublicListingImage", () => {
  it("removes JPEG metadata and preserves EXIF-oriented display dimensions", async () => {
    const input = await sharp({
      create: {
        width: 2,
        height: 3,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .jpeg()
      .withMetadata({
        orientation: 6,
        exif: { IFD0: { Artist: "private-owner-data" } },
      })
      .toBuffer();

    const originalMetadata = await sharp(input).metadata();
    const output = await sanitizePublicListingImage(input, "image/jpeg");
    const outputMetadata = await sharp(output).metadata();

    expect(originalMetadata.orientation).toBe(6);
    expect(outputMetadata.format).toBe("jpeg");
    expect([outputMetadata.width, outputMetadata.height]).toEqual([3, 2]);
    expect(outputMetadata.exif).toBeUndefined();
  });

  it.each([
    ["image/png", "png"],
    ["image/webp", "webp"],
  ] as const)("preserves %s format and strips metadata", async (contentType, format) => {
    const input = await sharp({
      create: {
        width: 3,
        height: 2,
        channels: 3,
        background: { r: 30, g: 80, b: 120 },
      },
    })
      .toFormat(format)
      .toBuffer();

    const output = await sanitizePublicListingImage(input, contentType);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe(format);
    expect(metadata.exif).toBeUndefined();
  });

  it("rejects a truncated image instead of passing the input through", async () => {
    await expect(
      sanitizePublicListingImage(Buffer.from([0xff, 0xd8, 0xff]), "image/jpeg"),
    ).rejects.toBeInstanceOf(PublicListingImageError);
  });

  it("flattens an animated WebP to its first frame", async () => {
    const frame = (value: number) => Buffer.alloc(3 * 2 * 3, value);
    const animated = await sharp(Buffer.concat([frame(30), frame(200)]), {
      raw: { width: 3, height: 4, channels: 3, pageHeight: 2 },
    })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();

    expect((await sharp(animated, { animated: true }).metadata()).pages).toBe(2);

    const output = await sanitizePublicListingImage(animated, "image/webp");
    const outputMetadata = await sharp(output, { animated: true }).metadata();

    expect(outputMetadata.format).toBe("webp");
    expect(outputMetadata.pages ?? 1).toBe(1);
  });
});
