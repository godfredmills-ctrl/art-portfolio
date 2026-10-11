import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CategoryIndex } from "@/components/site/category-index";
import { Hero } from "@/components/site/hero";
import { HorizontalGallery } from "@/components/site/horizontal-gallery";
import { Reveal } from "@/components/site/reveal";
import { ScrollText } from "@/components/site/scroll-text";
import { getCategories, getFeaturedArtworks, getSettings } from "@/lib/data";
import { paragraphs } from "@/lib/utils";

export default async function HomePage() {
  const [settings, featured, categories] = await Promise.all([
    getSettings(),
    getFeaturedArtworks(10),
    getCategories(),
  ]);

  const statementLead = paragraphs(settings.statement)[0];

  return (
    <>
      <Hero
        name={settings.artistName}
        tagline={settings.tagline}
        heroText={settings.heroText}
        location={settings.location}
        artwork={featured[0] ?? null}
      />

      {statementLead && (
        <section className="gutter grid grid-cols-12 gap-x-4 py-28 md:py-44">
          <Reveal className="col-span-12 mb-8 md:col-span-3 md:mb-0">
            <p className="label text-muted">Statement</p>
          </Reveal>
          <div className="col-span-12 md:col-span-9">
            <ScrollText
              text={statementLead}
              className="font-serif text-[clamp(1.9rem,3.6vw,3.6rem)] leading-[1.12] tracking-[-0.01em]"
            />
            <Reveal className="mt-12">
              <Link
                href="/statement"
                className="label group inline-flex items-center gap-3"
                data-cursor="Read"
              >
                <span className="link-underline">Read the full statement</span>
                <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      <HorizontalGallery artworks={featured} />

      <CategoryIndex categories={categories} />
    </>
  );
}
