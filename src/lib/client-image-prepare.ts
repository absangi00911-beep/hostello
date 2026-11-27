/**
 * Browser-side preparation of listing photos. Phone cameras routinely produce JPEGs larger
 * than the upload limit, so oversized images are scaled down and re-encoded before upload.
 * Files already within the limit are never touched, and every failure falls back to the
 * original file so the normal size validation can explain the problem.
 */

export const MAX_UPLOAD_DIMENSION = 2560;
export const FALLBACK_UPLOAD_DIMENSION = 1600;
const JPEG_QUALITIES = [0.86, 0.78, 0.7, 0.6] as const;

export interface DecodedImage {
  width: number;
  height: number;
  close?: () => void;
}

export interface ImagePrepareDeps {
  decode: (file: Blob) => Promise<DecodedImage>;
  encode: (
    image: DecodedImage,
    width: number,
    height: number,
    quality: number,
  ) => Promise<Blob | null>;
}

export function getScaledSize(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const ratio = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function jpegName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "");
  return `${base || "photo"}.jpg`;
}

const browserDeps: ImagePrepareDeps = {
  async decode(file) {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    return bitmap;
  },
  async encode(image, width, height, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    // JPEG has no transparency; flatten onto white rather than black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image as unknown as CanvasImageSource, 0, 0, width, height);
    return new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality),
    );
  },
};

export async function prepareImageForUpload(
  file: File,
  maxBytes: number,
  deps: ImagePrepareDeps = browserDeps,
): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= maxBytes) return file;

  let image: DecodedImage | null = null;
  try {
    image = await deps.decode(file);
    for (const dimension of [MAX_UPLOAD_DIMENSION, FALLBACK_UPLOAD_DIMENSION]) {
      const { width, height } = getScaledSize(image.width, image.height, dimension);
      for (const quality of JPEG_QUALITIES) {
        const blob = await deps.encode(image, width, height, quality);
        if (blob && blob.type === "image/jpeg" && blob.size > 0 && blob.size <= maxBytes) {
          return new File([blob], jpegName(file.name), {
            type: "image/jpeg",
            lastModified: file.lastModified,
          });
        }
      }
    }
  } catch {
    // Fall through to the original file.
  } finally {
    image?.close?.();
  }
  return file;
}
