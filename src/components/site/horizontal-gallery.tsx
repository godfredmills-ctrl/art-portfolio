"use client";

import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import type { ArtworkDTO } from "@/lib/data";
import { useHydrated } from "@/lib/use-hydrated";
import { padIndex } from "@/lib/utils";

function Slide({ artwork, index }: { artwork: ArtworkDTO; index: number }) {
  const cover = artwork.cover!;
  return (
    <Link
      href={`/works/${artwork.slug}`}
      data-cursor="View"
      className="group block shrink-0"
      style={{ width: `calc(58svh * ${cover.width / cover.height})` }}
    >
      <div className="bg-paper-2 relative h-[58svh] overflow-hidden">
        <Image
          src={cover.src}
          alt={cover.alt}
          fill
          sizes="(min-width: 768px) 50vw, 85vw"
          placeholder={cover.blurDataUrl ? "blur" : "empty"}
          blurDataURL={cover.blurDataUrl ?? undefined}
          className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-6">
        <div className="flex items-baseline gap-4">
          <span className="label text-muted">{padIndex(index + 1)}</span>
          <h3 className="font-serif text-2xl leading-tight">{artwork.title}</h3>
        </div>
        <span className="label text-muted">{artwork.year}</span>
      </div>
    </Link>
  );
}

function Intro({ count }: { count: number }) {
  return (
    <div className="flex w-[min(80vw,26rem)] shrink-0 flex-col justify-between self-stretch py-2">
      <p className="label text-muted">Selected works</p>
      <div>
        <h2 className="font-serif text-[clamp(3.5rem,6vw,6rem)] leading-[0.9] tracking-tight">
          A selection
          <br />
          <em>of recent work</em>
        </h2>
        <p className="label text-muted mt-6">{padIndex(count)} pieces — scroll</p>
      </div>
    </div>
  );
}

function Outro() {
  return (
    <Link
      href="/works"
      data-cursor="Enter"
      className="group border-line flex w-[min(80vw,24rem)] shrink-0 flex-col items-start justify-end gap-6 self-stretch border-l pb-2 pl-10"
    >
      <span className="label text-muted">Full index</span>
      <span className="font-serif text-6xl leading-none">
        All works
        <ArrowRight className="ml-3 inline size-10 transition-transform duration-700 group-hover:translate-x-3" />
      </span>
    </Link>
  );
}

/**
 * Desktop: the section pins and vertical scrolling drives the track sideways.
 * Mobile: a native swipeable row with scroll snapping.
 */
export function HorizontalGallery({ artworks }: { artworks: ArtworkDTO[] }) {
  const items = artworks.filter((a) => a.cover);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const hydrated = useHydrated();

  if (items.length === 0) return null;

  return (
    <>
      {/* Desktop: pinned horizontal scroll */}
      <section
        ref={sectionRef}
        aria-label="Selected works"
        className="relative hidden md:block"
        style={{ height: `calc(100svh + ${distance}px)` }}
      >
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
          <motion.div
            ref={trackRef}
            style={hydrated ? { x } : undefined}
            className="gutter flex w-max items-end gap-[5vw]"
          >
            <Intro count={items.length} />
            {items.map((a, i) => (
              <Slide key={a.id} artwork={a} index={i} />
            ))}
            <Outro />
          </motion.div>

          <div className="gutter absolute inset-x-0 bottom-8">
            <div className="bg-line h-px w-full">
              <motion.div
                className="bg-ink h-px origin-left"
                style={{ scaleX: hydrated ? scrollYProgress : 0 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: swipeable row */}
      <section aria-label="Selected works" className="py-20 md:hidden">
        <div className="gutter mb-8 flex items-end justify-between">
          <h2 className="font-serif text-5xl leading-none">
            Selected <em>works</em>
          </h2>
          <Link href="/works" className="label link-underline text-muted">
            View all
          </Link>
        </div>
        <div
          data-lenis-prevent-horizontal
          className="gutter flex snap-x snap-mandatory [scroll-padding-inline:clamp(1rem,3.2vw,3rem)] [scrollbar-width:none] gap-5 overflow-x-auto pb-4"
        >
          {items.map((a, i) => {
            const cover = a.cover!;
            return (
              <Link key={a.id} href={`/works/${a.slug}`} className="w-[78vw] shrink-0 snap-start">
                <div
                  className="bg-paper-2 relative overflow-hidden"
                  style={{ aspectRatio: `${cover.width} / ${cover.height}` }}
                >
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    sizes="80vw"
                    placeholder={cover.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={cover.blurDataUrl ?? undefined}
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-serif text-xl">
                    <span className="label text-muted mr-3">{padIndex(i + 1)}</span>
                    {a.title}
                  </span>
                  <span className="label text-muted">{a.year}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
