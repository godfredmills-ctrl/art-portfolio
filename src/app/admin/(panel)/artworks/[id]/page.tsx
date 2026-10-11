import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtworkForm, type ArtworkFormValues } from "@/components/admin/artwork-form";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { DimensionUnit } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artwork = await db.artwork.findUnique({ where: { id }, select: { title: true } });
  return { title: artwork?.title ?? "Artwork" };
}

export default async function EditArtworkPage({ params }: Props) {
  await requireUser();
  const { id } = await params;
  const [artwork, categories, mediums] = await Promise.all([
    db.artwork.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        mediums: { orderBy: { position: "asc" }, include: { medium: true } },
      },
    }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.medium.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!artwork) notFound();

  const num = (d: unknown) => (d == null ? "" : String(Number(d)));

  const initial: ArtworkFormValues = {
    title: artwork.title,
    slug: artwork.slug,
    year: String(artwork.year),
    categoryId: artwork.categoryId ?? "",
    mediums: artwork.mediums.map((m) => m.medium.name),
    height: num(artwork.height),
    width: num(artwork.width),
    depth: num(artwork.depth),
    unit: artwork.unit as DimensionUnit,
    dimensionsNote: artwork.dimensionsNote ?? "",
    description: artwork.description ?? "",
    published: artwork.published,
    featured: artwork.featured,
    images: artwork.images.map((img) => ({
      id: img.id,
      dbId: img.id,
      key: img.key,
      width: img.width,
      height: img.height,
      blurDataUrl: img.blurDataUrl,
      alt: img.alt,
      status: "done",
    })),
  };

  return (
    <ArtworkForm
      key={artwork.updatedAt.toISOString()}
      id={artwork.id}
      initial={initial}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      mediumOptions={mediums.map((m) => m.name)}
    />
  );
}
