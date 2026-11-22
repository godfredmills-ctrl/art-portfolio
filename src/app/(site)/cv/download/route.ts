import { cvResponse } from "@/lib/cv-response";

export const dynamic = "force-dynamic";

/** Downloads the current CV. */
export function GET() {
  return cvResponse("attachment");
}
