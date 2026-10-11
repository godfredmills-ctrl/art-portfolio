import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArtworksTable, type ArtworkRow } from "@/components/admin/artworks-table";
import { EmptyState, PageHeader, buttonClasses } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { publicArtworkOrder } from "@/lib/data";
import { mediaUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Artworks" };

export default async function ArtworksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser();
  const [{ status }, artworks, categories] = await Promise.all([
    searchParams,
    db.artwork.findMany({
      orderBy: publicArtworkOrder,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { id: true, name: true } },
        _count: { select: { images: true } },
      },
    }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  const rows: ArtworkRow[] = artworks.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    year: a.year,
    published: a.published,
    featured: a.featured,
    category: a.category,
    thumb: a.images[0] ? mediaUrl(a.images[0].key) : null,
    imageCount: a._count.images,
  }));

  return (
    <>
      <PageHeader
        title="Artworks"
        description={`${artworks.length} work${artworks.length === 1 ? "" : "s"} in your catalogue`}
        actions={
          <Link href="/admin/artworks/new" className={buttonClasses()}>
            <Plus className="size-4" /> Add artwork
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Your catalogue is empty"
          description="Add your first artwork with its title, year, mediums, dimensions and images."
          action={
            <Link href="/admin/artworks/new" className={buttonClasses()}>
              <Plus className="size-4" /> Add artwork
            </Link>
          }
        />
      ) : (
        <ArtworksTable
          rows={rows}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          initialStatus={status === "published" || status === "draft" ? status : "all"}
        />
      )}
    </>
  );
}
