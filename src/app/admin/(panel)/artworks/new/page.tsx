import type { Metadata } from "next";
import { ArtworkForm } from "@/components/admin/artwork-form";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "New artwork" };

export default async function NewArtworkPage() {
  await requireUser();
  const [categories, mediums] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.medium.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ArtworkForm
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      mediumOptions={mediums.map((m) => m.name)}
    />
  );
}
