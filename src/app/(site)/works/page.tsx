import type { Metadata } from "next";
import { Gallery } from "@/components/site/gallery";
import { RevealText } from "@/components/site/reveal";
import { getCategories, getPublishedArtworks } from "@/lib/data";
import { padIndex } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Works",
  description: "An index of paintings, drawings and other works.",
  alternates: { canonical: "/works" },
};

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const [{ category }, artworks, categories] = await Promise.all([
    searchParams,
    getPublishedArtworks(),
    getCategories(),
  ]);

  const initialCategory = typeof category === "string" ? category : undefined;

  return (
    <div className="gutter pt-36 pb-24 md:pt-48">
      <header className="mb-16 flex items-end justify-between gap-6 md:mb-24">
        <h1 className="font-serif text-[clamp(4.5rem,15vw,14rem)] leading-[0.82] tracking-[-0.02em]">
          <RevealText text="Works" onMount />
          <sup className="label text-muted ml-3 align-top md:ml-5">
            ({padIndex(artworks.length)})
          </sup>
        </h1>
        <p className="label text-muted hidden max-w-[16rem] text-right md:block">
          Index of works. Select a work to see it in detail.
        </p>
      </header>

      <Gallery
        key={initialCategory ?? "all"}
        artworks={artworks}
        categories={categories}
        initialCategory={initialCategory}
      />
    </div>
  );
}
