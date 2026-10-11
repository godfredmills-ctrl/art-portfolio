import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { formatDimensions, type DimensionUnit } from "./format";
import { mediaUrl } from "./utils";

export interface ImageDTO {
  id: string;
  src: string;
  width: number;
  height: number;
  blurDataUrl: string | null;
  alt: string;
}

export interface ArtworkDTO {
  id: string;
  title: string;
  slug: string;
  year: number;
  dimensions: string | null;
  mediums: string[];
  description: string | null;
  featured: boolean;
  category: { name: string; slug: string } | null;
  images: ImageDTO[];
  cover: ImageDTO | null;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number;
  cover: ImageDTO | null;
}

export interface SettingsDTO {
  artistName: string;
  tagline: string | null;
  heroText: string | null;
  statementTitle: string | null;
  statement: string | null;
  bio: string | null;
  portrait: ImageDTO | null;
  email: string | null;
  location: string | null;
  instagram: string | null;
  website: string | null;
  seoDescription: string | null;
}

const artworkInclude = {
  category: { select: { name: true, slug: true } },
  mediums: { select: { medium: { select: { name: true } } }, orderBy: { position: "asc" } },
  images: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ArtworkInclude;

type ArtworkRow = Prisma.ArtworkGetPayload<{ include: typeof artworkInclude }>;

export const publicArtworkOrder: Prisma.ArtworkOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { year: "desc" },
  { createdAt: "desc" },
];

function toNumber(d: Prisma.Decimal | null): number | null {
  return d == null ? null : Number(d);
}

function toArtwork(row: ArtworkRow): ArtworkDTO {
  const images: ImageDTO[] = row.images.map((img) => ({
    id: img.id,
    src: mediaUrl(img.key),
    width: img.width,
    height: img.height,
    blurDataUrl: img.blurDataUrl,
    alt: img.alt || row.title,
  }));
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    year: row.year,
    dimensions: formatDimensions({
      height: toNumber(row.height),
      width: toNumber(row.width),
      depth: toNumber(row.depth),
      unit: row.unit as DimensionUnit,
      dimensionsNote: row.dimensionsNote,
    }),
    mediums: row.mediums.map((m) => m.medium.name),
    description: row.description,
    featured: row.featured,
    category: row.category,
    images,
    cover: images[0] ?? null,
  };
}

export const getSettings = cache(async (): Promise<SettingsDTO> => {
  const s = await db.siteSettings.findUnique({ where: { id: 1 } });
  return {
    artistName: s?.artistName ?? "Artist Name",
    tagline: s?.tagline ?? null,
    heroText: s?.heroText ?? null,
    statementTitle: s?.statementTitle ?? null,
    statement: s?.statement ?? null,
    bio: s?.bio ?? null,
    portrait:
      s?.portraitKey && s.portraitWidth && s.portraitHeight
        ? {
            id: "portrait",
            src: mediaUrl(s.portraitKey),
            width: s.portraitWidth,
            height: s.portraitHeight,
            blurDataUrl: s.portraitBlur,
            alt: `Portrait of ${s.artistName}`,
          }
        : null,
    email: s?.email ?? null,
    location: s?.location ?? null,
    instagram: s?.instagram ?? null,
    website: s?.website ?? null,
    seoDescription: s?.seoDescription ?? null,
  };
});

export const getPublishedArtworks = cache(async (): Promise<ArtworkDTO[]> => {
  const rows = await db.artwork.findMany({
    where: { published: true },
    include: artworkInclude,
    orderBy: publicArtworkOrder,
  });
  return rows.map(toArtwork);
});

export const getFeaturedArtworks = cache(async (limit = 8): Promise<ArtworkDTO[]> => {
  const featured = await db.artwork.findMany({
    where: { published: true, featured: true, images: { some: {} } },
    include: artworkInclude,
    orderBy: publicArtworkOrder,
    take: limit,
  });
  if (featured.length > 0) return featured.map(toArtwork);

  const latest = await db.artwork.findMany({
    where: { published: true, images: { some: {} } },
    include: artworkInclude,
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return latest.map(toArtwork);
});

/** Categories that contain at least one published work. */
export const getCategories = cache(async (): Promise<CategoryDTO[]> => {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { artworks: { where: { published: true } } } },
      artworks: {
        where: { published: true, images: { some: {} } },
        orderBy: publicArtworkOrder,
        take: 1,
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
  });

  return rows
    .filter((c) => c._count.artworks > 0)
    .map((c) => {
      const art = c.artworks[0];
      const img = art?.images[0];
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        count: c._count.artworks,
        cover: img
          ? {
              id: img.id,
              src: mediaUrl(img.key),
              width: img.width,
              height: img.height,
              blurDataUrl: img.blurDataUrl,
              alt: img.alt || art.title,
            }
          : null,
      };
    });
});

export interface ArtworkDetail {
  artwork: ArtworkDTO;
  index: number;
  total: number;
  prev: ArtworkDTO | null;
  next: ArtworkDTO | null;
  related: ArtworkDTO[];
}

export const getArtworkDetail = cache(async (slug: string): Promise<ArtworkDetail | null> => {
  const all = await getPublishedArtworks();
  const index = all.findIndex((a) => a.slug === slug);
  if (index === -1) return null;
  const artwork = all[index]!;
  const total = all.length;

  const related = artwork.category
    ? all.filter((a) => a.id !== artwork.id && a.category?.slug === artwork.category?.slug)
    : [];

  return {
    artwork,
    index,
    total,
    prev: total > 1 ? all[(index - 1 + total) % total]! : null,
    next: total > 1 ? all[(index + 1) % total]! : null,
    related: related.slice(0, 3),
  };
});
