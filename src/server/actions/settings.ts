"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteStoredImages } from "@/lib/images";
import { fieldErrors, settingsSchema } from "@/lib/validation";
import type { ActionResult } from "./types";

export async function saveSettings(input: unknown): Promise<ActionResult> {
  await requireUser();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const { portrait, ...fields } = parsed.data;
  if (portrait && !portrait.key.startsWith("site/")) {
    return { ok: false, message: "Invalid portrait image. Please re-upload it." };
  }

  const current = await db.siteSettings.findUnique({ where: { id: 1 } });
  const portraitFields = {
    portraitKey: portrait?.key ?? null,
    portraitWidth: portrait?.width ?? null,
    portraitHeight: portrait?.height ?? null,
    portraitBlur: portrait?.blurDataUrl ?? null,
  };

  await db.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...fields, ...portraitFields },
    update: { ...fields, ...portraitFields },
  });

  if (current?.portraitKey && current.portraitKey !== portrait?.key) {
    await deleteStoredImages([current.portraitKey]);
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Site content saved" };
}
