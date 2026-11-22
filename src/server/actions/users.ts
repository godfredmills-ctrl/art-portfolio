"use server";

import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fieldErrors, newAdminSchema } from "@/lib/validation";
import type { ActionResult, FormState } from "./types";

export async function createAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const parsed = newAdminSchema.safeParse({
    ...values,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values };

  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, errors: { email: "An admin with this email already exists" }, values };
  }

  await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  revalidatePath("/admin/account");
  return { ok: true, message: `Admin account created for ${email}` };
}

export async function deleteAdmin(id: string): Promise<ActionResult> {
  const me = await requireUser();
  if (id === me.id) return { ok: false, message: "You can't remove your own account." };

  const target = await db.user.findUnique({ where: { id }, select: { email: true } });
  if (!target) return { ok: false, message: "That admin no longer exists." };
  if ((await db.user.count()) <= 1) {
    return { ok: false, message: "There must be at least one admin." };
  }

  // Deleting the user also ends their sessions: every request re-checks the user exists.
  await db.user.delete({ where: { id } });
  revalidatePath("/admin/account");
  return { ok: true, message: `Removed ${target.email}` };
}
