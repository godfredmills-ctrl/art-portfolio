"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CategoryDTO } from "@/lib/data";
import { EASE_OUT } from "@/lib/motion";
import { padIndex } from "@/lib/utils";

/**
 * Large typographic list of categories. On hover (desktop), a preview of the
 * category's lead work floats beside the cursor.
 */
export function CategoryIndex({ categories }: { categories: CategoryDTO[] }) {
  const [active, setActive] = useState<CategoryDTO | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 180, damping: 22, mass: 0.6 });

  if (categories.length === 0) return null;

  return (
    <section className="gutter py-28 md:py-40" aria-labelledby="categories-heading">
      <div className="mb-14 flex items-end justify-between gap-6">
        <h2 id="categories-heading" className="label text-muted">
          Bodies of work
        </h2>
        <span className="label text-muted">{padIndex(categories.length)} series</span>
      </div>

      <ul
        className="group/list border-line border-t"
        onPointerMove={(e) => {
          x.set(e.clientX);
          y.set(e.clientY);
        }}
        onPointerLeave={() => setActive(null)}
      >
        {categories.map((c, i) => (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -5% 0px" }}
            transition={{ duration: 1, ease: EASE_OUT, delay: i * 0.06 }}
            className="border-line border-b"
          >
            <Link
              href={`/works?category=${c.slug}`}
              onPointerEnter={() => setActive(c)}
              data-cursor="Explore"
              className="group flex items-center gap-6 py-7 transition-opacity duration-500 group-hover/list:opacity-35 hover:opacity-100! md:py-9"
            >
              <span className="label text-muted w-10">{padIndex(i + 1)}</span>
              {c.cover && (
                <span className="bg-paper-2 relative size-16 shrink-0 overflow-hidden md:hidden">
                  <Image src={c.cover.src} alt="" fill sizes="64px" className="object-cover" />
                </span>
              )}
              <span className="flex-1 font-serif text-[clamp(2.5rem,7vw,6.5rem)] leading-[0.95] tracking-tight transition-transform duration-700 ease-[var(--ease-expo)] md:group-hover:translate-x-6">
                {c.name}
              </span>
              <span className="label text-muted hidden sm:inline">
                {c.count} {c.count === 1 ? "work" : "works"}
              </span>
              <ArrowUpRight className="size-6 shrink-0 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 md:size-8" />
            </Link>
          </motion.li>
        ))}
      </ul>

      <motion.div
        aria-hidden
        style={{ x: sx, y: sy }}
        className="pointer-events-none fixed top-0 left-0 z-40 hidden md:block"
      >
        <AnimatePresence mode="popLayout">
          {active?.cover && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 3 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="bg-paper-2 relative ml-10 -translate-y-1/2 overflow-hidden shadow-2xl"
              style={{
                width: "18vw",
                aspectRatio: `${active.cover.width} / ${active.cover.height}`,
              }}
            >
              <Image src={active.cover.src} alt="" fill sizes="20vw" className="object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
