import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireUser();
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { artworks: true } } },
  });

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group works into series or disciplines. Drag to set the order shown on the site."
      />
      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? "",
          count: c._count.artworks,
        }))}
      />
    </>
  );
}
