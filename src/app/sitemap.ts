import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const artworks = await db.artwork.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const latest = artworks[0]?.updatedAt ?? new Date();

  return [
    { url: base, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/works`, lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/statement`, changeFrequency: "monthly", priority: 0.7 },
    ...artworks.map((a) => ({
      url: `${base}/works/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
