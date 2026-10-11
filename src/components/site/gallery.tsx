"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { ArtworkDTO, CategoryDTO } from "@/lib/data";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ArtworkCard } from "./artwork-card";

const ALL = "all";

export function Gallery({
  artworks,
  categories,
  initialCategory,
}: {
  artworks: ArtworkDTO[];
  categories: CategoryDTO[];
  initialCategory?: string;
}) {
  const valid = categories.some((c) => c.slug === initialCategory);
  const [active, setActive] = useState(valid ? initialCategory! : ALL);

  const visible = useMemo(
    () => (active === ALL ? artworks : artworks.filter((a) => a.category?.slug === active)),
    [active, artworks],
  );
  const activeCategory = categories.find((c) => c.slug === active);

  function select(slug: string) {
    setActive(slug);
    // Keep the URL shareable without triggering a server round-trip.
    const url = slug === ALL ? "/works" : `/works?category=${slug}`;
    window.history.replaceState(null, "", url);
  }

  const filters = [
    { slug: ALL, name: "All", count: artworks.length },
    ...categories.map((c) => ({ slug: c.slug, name: c.name, count: c.count })),
  ];

  return (
    <div>
      {categories.length > 0 && (
        <LayoutGroup>
          <nav
            aria-label="Filter by category"
            className="sticky top-24 z-30 -mx-1 mb-14 flex flex-wrap gap-1 md:mb-20"
          >
            <div className="border-line bg-paper/80 flex flex-wrap gap-1 rounded-full border p-1 backdrop-blur-md">
              {filters.map((f) => {
                const selected = f.slug === active;
                return (
                  <button
                    key={f.slug}
                    type="button"
                    onClick={() => select(f.slug)}
                    aria-pressed={selected}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm transition-colors duration-300",
                      selected ? "text-paper" : "text-ink-2 hover:text-ink",
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="filter-pill"
                        className="bg-ink absolute inset-0 rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative flex items-baseline gap-1.5">
                      {f.name}
                      <sup className="font-mono text-[0.6rem] opacity-60">{f.count}</sup>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </LayoutGroup>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          {activeCategory?.description && (
            <p className="text-ink-2 mb-16 max-w-2xl font-serif text-2xl leading-snug md:text-3xl">
              {activeCategory.description}
            </p>
          )}

          {visible.length === 0 ? (
            <p className="text-muted py-24 text-center">No works here yet.</p>
          ) : (
            <div className="columns-1 gap-x-8 sm:columns-2 lg:columns-3 lg:gap-x-12">
              {visible.map((artwork, i) => (
                <div key={artwork.id} className="mb-14 break-inside-avoid md:mb-20">
                  <ArtworkCard artwork={artwork} delay={(i % 3) * 0.08} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
