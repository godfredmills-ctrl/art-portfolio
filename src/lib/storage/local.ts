import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { contentTypeFor } from "./keys";
import type { StorageDriver } from "./index";

/** Stores files on disk. On Railway, point UPLOAD_DIR at a mounted Volume. */
export function createLocalStorage(): StorageDriver {
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "./.data/uploads");

  function resolve(key: string): string {
    const full = path.resolve(/*turbopackIgnore: true*/ root, key);
    if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  return {
    async put(key, body) {
      const file = resolve(key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body);
    },

    async get(key) {
      const file = resolve(key);
      try {
        const info = await stat(file);
        if (!info.isFile()) return null;
        const stream = Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>;
        return { body: stream, contentType: contentTypeFor(key), size: info.size };
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw err;
      }
    },

    async delete(key) {
      await rm(resolve(key), { force: true });
    },
  };
}
