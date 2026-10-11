import { createLocalStorage } from "./local";
import { createS3Storage } from "./s3";

export { contentTypeFor, isValidKey } from "./keys";

export interface StoredObject {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  size?: number;
}

export interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

let driver: StorageDriver | undefined;

export function storage(): StorageDriver {
  if (driver) return driver;
  driver = process.env.STORAGE_DRIVER === "s3" ? createS3Storage() : createLocalStorage();
  return driver;
}
