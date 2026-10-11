"use client";

import { motion, useScroll, useTransform, type MotionStyle } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ArtworkDTO } from "@/lib/data";
import { EASE_OUT } from "@/lib/motion";
import { useHydrated } from "@/lib/use-hydrated";
import { ImageReveal, RevealText } from "./reveal";

export function Hero({
  name,
  tagline,
  heroText,
  location,
  artwork,
}: {
  name: string;
  tagline: string | null;
  heroText: string | null;
  location: string | null;
  artwork: ArtworkDTO | null;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const hydrated = useHydrated();

  const [first, ...rest] = name.split(" ");
  const cover = artwork?.cover;

  return (
    <section ref={ref} className="gutter relative flex min-h-[100svh] flex-col pt-28 pb-8 md:pb-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        <motion.div
          style={hydrated ? { opacity: fade } : undefined}
          className="label text-muted flex justify-between"
        >
          <span>{tagline ?? "Selected works"}</span>
          {location && <span className="hidden sm:inline">{location}</span>}
        </motion.div>
      </motion.div>

      <div className="relative mt-8 grid flex-1 grid-cols-12 gap-x-4">
        {cover && artwork && (
          <motion.div
            style={
              {
                "--ratio": cover.width / cover.height,
                ...(hydrated ? { y: imageY } : {}),
              } as MotionStyle
            }
            // On phones, size by height so the name stays above the fold.
            className="col-span-12 mb-10 ml-auto w-[min(100%,calc(44svh*var(--ratio)))] md:absolute md:top-0 md:right-0 md:mb-0 md:w-[36vw] lg:w-[30vw]"
          >
            <Link href={`/works/${artwork.slug}`} data-cursor="View" className="block">
              <ImageReveal onMount delay={0.2} className="bg-paper-2">
                <div
                  className="relative w-full"
                  style={{ aspectRatio: `${cover.width} / ${cover.height}`, maxHeight: "68svh" }}
                >
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    priority
                    quality={90}
                    sizes="(min-width: 1024px) 30vw, (min-width: 768px) 36vw, 90vw"
                    placeholder={cover.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={cover.blurDataUrl ?? undefined}
                    className="object-cover"
                  />
                </div>
              </ImageReveal>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="label text-muted mt-3 flex justify-between"
              >
                <span className="truncate pr-4">{artwork.title}</span>
                <span>{artwork.year}</span>
              </motion.p>
            </Link>
          </motion.div>
        )}

        <motion.div
          style={hydrated ? { y: nameY } : undefined}
          className="col-span-12 self-end md:col-span-9 lg:col-span-8"
        >
          {heroText && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.9 }}
              className="text-ink-2 mb-8 max-w-sm text-lg leading-snug md:mb-10"
            >
              {heroText}
            </motion.p>
          )}
          <h1 className="font-serif text-[clamp(4.25rem,13.5vw,15rem)] leading-[0.82] tracking-[-0.02em]">
            <RevealText text={first ?? name} onMount delay={0.15} className="block" />
            {rest.length > 0 && (
              <RevealText
                text={rest.join(" ")}
                onMount
                delay={0.3}
                className="block italic md:pl-[0.6em]"
              />
            )}
          </h1>
        </motion.div>
      </div>

      <motion.div
        style={hydrated ? { opacity: fade } : undefined}
        className="label text-muted mt-10 flex items-center justify-between"
      >
        <span className="flex items-center gap-3">
          <span className="bg-line relative h-px w-12 overflow-hidden">
            <motion.span
              className="bg-ink absolute inset-0"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
          Scroll
        </span>
        <span>© {new Date().getFullYear()}</span>
      </motion.div>
    </section>
  );
}
