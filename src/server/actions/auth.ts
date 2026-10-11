"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema, passwordSchema, profileSchema } from "@/lib/validation";
import type { FormState } from "./types";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Only allow redirects back into the admin. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values };

  const { email, password } = parsed.data;
  const limitKey = `login:${await clientIp()}`;
  const limit = rateLimit(limitKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return {
      ok: false,
      message: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      values,
    };
  }

  const user = await db.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !valid) return { ok: false, message: "Incorrect email or password.", values };

  resetRateLimit(limitKey);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values };

  const clash = await db.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: user.id } },
    select: { id: true },
  });
  if (clash) return { ok: false, errors: { email: "That email is already in use" }, values };

  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profile updated", values };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessionUser = await requireUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { ok: false, errors: { currentPassword: "Current password is incorrect" } };
  }

  // Bumping tokenVersion signs out every other session; re-issue this one.
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      tokenVersion: { increment: 1 },
    },
  });
  await createSession(updated);
  return { ok: true, message: "Password changed. Other sessions have been signed out." };
}
