import "server-only";
import { db } from "./db";
import { cvDownloadName } from "./documents";
import { storage } from "./storage";

/**
 * Streams the current CV. "inline" is used for the embedded viewer, "attachment"
 * for downloads; both carry a friendly file name like "Jane-Doe-CV.pdf".
 */
export async function cvResponse(disposition: "inline" | "attachment"): Promise<Response> {
  const settings = await db.siteSettings.findUnique({
    where: { id: 1 },
    select: { cvKey: true, artistName: true },
  });
  if (!settings?.cvKey) return new Response("Not found", { status: 404 });

  const object = await storage().get(settings.cvKey);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `${disposition}; filename="${cvDownloadName(settings.artistName)}"`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (object.size != null) headers.set("Content-Length", String(object.size));

  return new Response(object.body, { headers });
}
