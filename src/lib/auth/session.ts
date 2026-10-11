import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./jwt";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export async function createSession(user: { id: string; tokenVersion: number }) {
  const token = await signSession({ sub: user.id, ver: user.tokenVersion });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Verifies the cookie and confirms the user still exists with a matching token version. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, tokenVersion: true },
  });
  if (!user || user.tokenVersion !== session.ver) return null;

  return { id: user.id, email: user.email, name: user.name };
});

/** Guard for admin pages and server actions. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}
