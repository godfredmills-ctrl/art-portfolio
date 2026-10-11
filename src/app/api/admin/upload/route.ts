import { getCurrentUser } from "@/lib/auth/session";
import { ImageProcessingError, MAX_UPLOAD_BYTES, processAndStoreImage } from "@/lib/images";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients; the session cookie is still required
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Accepts a single image (multipart field "file"), optimises it and stores it. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (!rateLimit(`upload:${user.id}`, 120, 60 * 60 * 1000).ok) {
    return Response.json({ error: "Upload limit reached, try again later" }, { status: 429 });
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 1024 * 1024) {
    return Response.json({ error: "Image is larger than 25 MB" }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  const folder = form.get("folder") === "site" ? "site" : "artworks";

  try {
    const image = await processAndStoreImage(Buffer.from(await file.arrayBuffer()), folder);
    return Response.json(image, { status: 201 });
  } catch (err) {
    if (err instanceof ImageProcessingError) {
      return Response.json({ error: err.message }, { status: 422 });
    }
    console.error("[upload] failed", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
