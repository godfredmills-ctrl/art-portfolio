import { isValidKey, storage } from "@/lib/storage";

/**
 * Serves stored media from whichever storage driver is configured, so image
 * URLs stay stable (`/media/<key>`) even if the backing store changes.
 * Keys are content-unique, so responses are cached forever.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await params;
  const key = segments.join("/");
  if (!isValidKey(key)) return new Response("Not found", { status: 404 });

  const object = await storage().get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": object.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  if (object.size != null) headers.set("Content-Length", String(object.size));

  return new Response(object.body, { headers });
}
