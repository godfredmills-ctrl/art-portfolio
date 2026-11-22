import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cleanFileName, DocumentError, MAX_CV_BYTES, storeCv } from "@/lib/documents";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function authorize(request: Request) {
  const user = await getCurrentUser();
  if (!user) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isSameOrigin(request))
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

async function removeFile(key: string | null | undefined) {
  if (!key) return;
  await storage()
    .delete(key)
    .catch((err) => console.error(`[cv] failed to delete ${key}`, err));
}

/** Uploads a new CV (multipart field "file") and replaces the current one. */
export async function POST(request: Request) {
  const { user, error } = await authorize(request);
  if (error) return error;

  if (!rateLimit(`cv:${user.id}`, 30, 60 * 60 * 1000).ok) {
    return Response.json({ error: "Upload limit reached, try again later" }, { status: 429 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_CV_BYTES + 1024 * 1024) {
    return Response.json({ error: "The CV must be 15 MB or smaller" }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return Response.json({ error: "Invalid upload" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  let stored: { key: string; size: number };
  try {
    stored = await storeCv(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    if (err instanceof DocumentError) return Response.json({ error: err.message }, { status: 422 });
    console.error("[cv] upload failed", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }

  const previous = await db.siteSettings.findUnique({ where: { id: 1 }, select: { cvKey: true } });
  const cv = {
    cvKey: stored.key,
    cvFileName: cleanFileName(file.name),
    cvSize: stored.size,
    cvUpdatedAt: new Date(),
  };
  await db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...cv }, update: cv });
  await removeFile(previous?.cvKey);

  revalidatePath("/", "layout");
  return Response.json(
    { fileName: cv.cvFileName, size: cv.cvSize, updatedAt: cv.cvUpdatedAt.toISOString() },
    { status: 201 },
  );
}

/** Removes the CV from the site. */
export async function DELETE(request: Request) {
  const { error } = await authorize(request);
  if (error) return error;

  const current = await db.siteSettings.findUnique({ where: { id: 1 }, select: { cvKey: true } });
  if (current?.cvKey) {
    await db.siteSettings.update({
      where: { id: 1 },
      data: { cvKey: null, cvFileName: null, cvSize: null, cvUpdatedAt: null },
    });
    await removeFile(current.cvKey);
  }

  revalidatePath("/", "layout");
  return new Response(null, { status: 204 });
}
