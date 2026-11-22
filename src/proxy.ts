import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";

/**
 * Optimistic auth gate for the admin UI: bounces visitors without a valid
 * session cookie to the login page. Every admin page, server action and API
 * route still re-checks the session against the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  // The login page itself sends signed-in users onward, after checking the database.
  // Redirecting here on the cookie alone would loop for a revoked session.
  if (pathname === "/admin/login") return NextResponse.next();

  if (!session) {
    const url = new URL("/admin/login", request.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
