"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteStoredImages } from "@/lib/images";
import { slugify } from "@/lib/utils";
import { artworkSchema, fieldErrors } from "@/lib/validation";
import type { ActionResult } from "./types";

function refreshSite() {
  revalidatePath("/", "layout");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "untitled";
  const taken = new Set(
    (
      await db.artwork.findMany({
        where: { slug: { startsWith: root }, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
        select: { slug: true },
      })
    ).map((a) => a.slug),
  );
  if (!taken.has(root)) return root;
  for (let i = 2; ; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export async function saveArtwork(
  id: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string; images: { id: string; key: string }[] }>> {
  await requireUser();

  const parsed = artworkSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const existing = id
    ? await db.artwork.findUnique({ where: { id }, include: { images: true } })
    : null;
  if (id && !existing) return { ok: false, message: "This artwork no longer exists." };

  if (data.categoryId) {
    const category = await db.category.findUnique({ where: { id: data.categoryId } });
    if (!category)
      return {
        ok: false,
        message: "Selected category was not found.",
        errors: { categoryId: "Choose a valid category" },
      };
  }

  // Only accept image keys that were produced by our upload endpoint.
  for (const img of data.images) {
    if (!img.key.startsWith("artworks/")) {
      return { ok: false, message: "One of the images is invalid. Please re-upload it." };
    }
  }

  const slug = await uniqueSlug(data.slug || slugify(data.title), id ?? undefined);

  // Resolve mediums case-insensitively so "Oil" and "oil" share one record.
  const mediumIds: string[] = [];
  for (const name of data.mediums) {
    const found = await db.medium.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    mediumIds.push(found ? found.id : (await db.medium.create({ data: { name } })).id);
  }

  const fields = {
    title: data.title,
    slug,
    year: data.year,
    height: data.height,
    width: data.width,
    depth: data.depth,
    unit: data.unit,
    dimensionsNote: data.dimensionsNote,
    description: data.description,
    published: data.published,
    featured: data.featured,
    category: data.categoryId
      ? { connect: { id: data.categoryId } }
      : existing
        ? { disconnect: true }
        : undefined,
  };

  const keptIds = new Set(data.images.map((i) => i.id).filter(Boolean));
  const removed = existing?.images.filter((img) => !keptIds.has(img.id)) ?? [];

  const artwork = await db
    .$transaction(async (tx) => {
      const saved = existing
        ? await tx.artwork.update({ where: { id: existing.id }, data: fields })
        : await tx.artwork.create({
            data: {
              ...fields,
              // New works appear first in the default ordering.
              sortOrder:
                ((await tx.artwork.aggregate({ _min: { sortOrder: true } }))._min.sortOrder ?? 1) -
                1,
            },
          });

      await tx.artworkMedium.deleteMany({ where: { artworkId: saved.id } });
      await tx.artworkMedium.createMany({
        data: mediumIds.map((mediumId, position) => ({ artworkId: saved.id, mediumId, position })),
      });

      if (removed.length > 0) {
        await tx.artworkImage.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } });
      }

      for (const [index, img] of data.images.entries()) {
        const owned = img.id && existing?.images.some((e) => e.id === img.id);
        if (owned) {
          await tx.artworkImage.update({
            where: { id: img.id },
            data: { alt: img.alt ?? null, sortOrder: index },
          });
        } else {
          await tx.artworkImage.create({
            data: {
              artworkId: saved.id,
              key: img.key,
              width: img.width,
              height: img.height,
              blurDataUrl: img.blurDataUrl ?? null,
              alt: img.alt ?? null,
              sortOrder: index,
            },
          });
        }
      }
      return saved;
    })
    .catch((err: unknown) => {
      if ((err as { code?: string }).code === "P2002") return null;
      throw err;
    });

  if (!artwork) {
    return { ok: false, message: "That slug or image is already in use. Please try again." };
  }

  await deleteStoredImages(removed.map((r) => r.key));
  await db.medium.deleteMany({ where: { artworks: { none: {} } } });
  refreshSite();

  const images = await db.artworkImage.findMany({
    where: { artworkId: artwork.id },
    select: { id: true, key: true },
  });

  return {
    ok: true,
    message: existing ? "Artwork saved" : "Artwork created",
    data: { id: artwork.id, slug: artwork.slug, images },
  };
}

export async function deleteArtwork(id: string): Promise<ActionResult> {
  await requireUser();
  const artwork = await db.artwork.findUnique({ where: { id }, include: { images: true } });
  if (!artwork) return { ok: false, message: "Artwork not found." };

  await db.artwork.delete({ where: { id } });
  await deleteStoredImages(artwork.images.map((i) => i.key));
  await db.medium.deleteMany({ where: { artworks: { none: {} } } });
  refreshSite();
  return { ok: true, message: `“${artwork.title}” deleted` };
}

export async function setArtworkFlag(
  id: string,
  flag: "published" | "featured",
  value: boolean,
): Promise<ActionResult> {
  await requireUser();
  await db.artwork.update({ where: { id }, data: { [flag]: value } });
  refreshSite();
  return { ok: true };
}

export async function reorderArtworks(ids: string[]): Promise<ActionResult> {
  await requireUser();
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  await db.$transaction(
    ids.map((id, index) => db.artwork.update({ where: { id }, data: { sortOrder: index } })),
  );
  refreshSite();
  return { ok: true, message: "Order saved" };
}
