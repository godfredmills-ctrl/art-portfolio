import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageDriver } from "./index";

/** Any S3-compatible bucket: Railway Buckets, AWS S3, Cloudflare R2, MinIO… */
export function createS3Storage(): StorageDriver {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "STORAGE_DRIVER=s3 requires S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY",
    );
  }

  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
  });

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    },

    async get(key) {
      try {
        const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (!res.Body) return null;
        return {
          body: res.Body.transformToWebStream() as ReadableStream<Uint8Array>,
          contentType: res.ContentType ?? "application/octet-stream",
          size: res.ContentLength,
        };
      } catch (err) {
        if (err instanceof NoSuchKey || (err as { name?: string }).name === "NoSuchKey") {
          return null;
        }
        throw err;
      }
    },

    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
