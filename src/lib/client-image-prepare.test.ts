import { describe, expect, it, vi } from "vitest";
import {
  getScaledSize,
  prepareImageForUpload,
  type ImagePrepareDeps,
} from "./client-image-prepare";

const MB = 1024 * 1024;

function makeFile(size: number, type = "image/jpeg", name = "IMG_0001.HEIC.jpeg") {
  return new File([new Uint8Array(size)], name, { type });
}

function makeDeps(encodedSizes: number[]): ImagePrepareDeps & {
  encode: ReturnType<typeof vi.fn>;
  decode: ReturnType<typeof vi.fn>;
} {
  let call = 0;
  return {
    decode: vi.fn(async () => ({ width: 4000, height: 3000, close: vi.fn() })),
    encode: vi.fn(async () => {
      const size = encodedSizes[Math.min(call, encodedSizes.length - 1)];
      call += 1;
      return new Blob([new Uint8Array(size)], { type: "image/jpeg" });
    }),
  };
}

describe("getScaledSize", () => {
  it("keeps images that are already small enough", () => {
    expect(getScaledSize(1200, 800, 2560)).toEqual({ width: 1200, height: 800 });
  });

  it("scales the longest side down and preserves the aspect ratio", () => {
    expect(getScaledSize(4000, 3000, 2560)).toEqual({ width: 2560, height: 1920 });
    expect(getScaledSize(3000, 4000, 2560)).toEqual({ width: 1920, height: 2560 });
  });
});

describe("prepareImageForUpload", () => {
  it("returns files within the limit untouched without decoding them", async () => {
    const deps = makeDeps([1]);
    const file = makeFile(3 * MB);

    expect(await prepareImageForUpload(file, 4 * MB, deps)).toBe(file);
    expect(deps.decode).not.toHaveBeenCalled();
  });

  it("leaves non-images for the normal validation to reject", async () => {
    const deps = makeDeps([1]);
    const file = makeFile(9 * MB, "application/pdf", "lease.pdf");

    expect(await prepareImageForUpload(file, 4 * MB, deps)).toBe(file);
    expect(deps.decode).not.toHaveBeenCalled();
  });

  it("resizes an oversized phone photo to a JPEG under the limit", async () => {
    const deps = makeDeps([3 * MB]);
    const result = await prepareImageForUpload(makeFile(8 * MB), 4 * MB, deps);

    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBe(3 * MB);
    expect(result.name).toBe("IMG_0001.HEIC.jpg");
    expect(deps.encode).toHaveBeenCalledWith(expect.anything(), 2560, 1920, 0.86);
  });

  it("lowers quality, then dimensions, until the file fits", async () => {
    const deps = makeDeps([6 * MB, 5 * MB, 5 * MB, 5 * MB, 2 * MB]);
    const result = await prepareImageForUpload(makeFile(9 * MB), 4 * MB, deps);

    expect(result.size).toBe(2 * MB);
    const lastCall = deps.encode.mock.calls.at(-1)!;
    expect(lastCall.slice(1)).toEqual([1600, 1200, 0.86]);
  });

  it("returns the original file when it cannot be made small enough", async () => {
    const deps = makeDeps([9 * MB]);
    const file = makeFile(12 * MB);

    expect(await prepareImageForUpload(file, 4 * MB, deps)).toBe(file);
  });

  it("returns the original file when the image cannot be decoded", async () => {
    const deps: ImagePrepareDeps = {
      decode: vi.fn(async () => {
        throw new Error("unsupported");
      }),
      encode: vi.fn(),
    };
    const file = makeFile(8 * MB);

    expect(await prepareImageForUpload(file, 4 * MB, deps)).toBe(file);
  });

  it("releases the decoded image", async () => {
    const close = vi.fn();
    const deps: ImagePrepareDeps = {
      decode: async () => ({ width: 100, height: 100, close }),
      encode: async () => new Blob([new Uint8Array(10)], { type: "image/jpeg" }),
    };

    await prepareImageForUpload(makeFile(8 * MB), 4 * MB, deps);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
