import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Used by Railway's healthcheck to gate deploys. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[health] database check failed", err);
    return Response.json({ status: "error" }, { status: 503 });
  }
}
