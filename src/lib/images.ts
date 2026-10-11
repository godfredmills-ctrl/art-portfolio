import { randomUUID } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import { storage } from "./storage";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 3000;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "tiff", "heif", "gif"]);

export interface ProcessedImage {
  key: string;
  width: number;
  height: number;
  blurDataUrl: string;
}

export class ImageProcessingError extends Error {}

/**
 * Normalises an uploaded image for the web: honours EXIF orientation,
 * converts to sRGB, caps the long edge and encodes as high-quality WebP.
 * next/image then serves responsive sizes from this master.
 */
export async function processAndStoreImage(
  input: Buffer,
  folder: "artworks" | "site" = "artworks",
): Promise<ProcessedImage> {
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImageProcessingError("Image is larger than 25 MB");
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(input).metadata();
  } catch {
    throw new ImageProcessingError("File is not a supported image");
  }
  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new ImageProcessingError("Use JPEG, PNG, WebP, AVIF, TIFF or HEIC images");
  }

  const pipeline = sharp(input, { limitInputPixels: 268_402_689 })
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb");

  const { data, info } = await pipeline
    .clone()
    .webp({ quality: 90, smartSubsample: true, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  const blur = await pipeline
    .clone()
    .resize(24, 24, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();

  const now = new Date();
  const key = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;

  await storage().put(key, data, "image/webp");

  return {
    key,
    width: info.width,
    height: info.height,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

/** Best-effort removal; a failed delete shouldn't break the user's action. */
export async function deleteStoredImages(keys: string[]): Promise<void> {
  await Promise.all(
    keys.map((key) =>
      storage()
        .delete(key)
        .catch((err) => console.error(`[storage] failed to delete ${key}`, err)),
    ),
  );
}
