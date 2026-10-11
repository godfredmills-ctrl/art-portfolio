"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { categorySchema, fieldErrors } from "@/lib/validation";
import type { ActionResult } from "./types";

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult> {
  await requireUser();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const { name, description } = parsed.data;
  const slug = parsed.data.slug || slugify(name) || "category";

  const clash = await db.category.findFirst({
    where: { slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) {
    return { ok: false, message: "That slug is already used.", errors: { slug: "Already in use" } };
  }

  if (id) {
    await db.category.update({ where: { id }, data: { name, slug, description } });
  } else {
    const max = await db.category.aggregate({ _max: { sortOrder: true } });
    await db.category.create({
      data: { name, slug, description, sortOrder: (max._max.sortOrder ?? -1) + 1 },
    });
  }

  refresh();
  return { ok: true, message: id ? "Category updated" : "Category created" };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireUser();
  const category = await db.category.findUnique({ where: { id } });
  if (!category) return { ok: false, message: "Category not found." };
  // Artworks are kept; their category is cleared (onDelete: SetNull).
  await db.category.delete({ where: { id } });
  refresh();
  return { ok: true, message: `“${category.name}” deleted` };
}

export async function reorderCategories(ids: string[]): Promise<ActionResult> {
  await requireUser();
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  await db.$transaction(
    ids.map((id, index) => db.category.update({ where: { id }, data: { sortOrder: index } })),
  );
  refresh();
  return { ok: true, message: "Order saved" };
}
