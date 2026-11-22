import { cvResponse } from "@/lib/cv-response";

export const dynamic = "force-dynamic";

/** Serves the current CV for viewing in the browser (embedded on /cv and in the admin). */
export function GET() {
  return cvResponse("inline");
}
