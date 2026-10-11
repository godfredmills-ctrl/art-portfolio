"use client";

import { useLenis } from "lenis/react";
import { ArrowLeft, ArrowRight, Maximize2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ImageDTO } from "@/lib/data";
import { EASE_OUT } from "@/lib/motion";
import { cn, padIndex } from "@/lib/utils";
import { ImageReveal } from "./reveal";

export function ArtworkViewer({ images, title }: { images: ImageDTO[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = images[index];

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + images.length) % images.length),
    [images.length],
  );

  if (!current) {
    return (
      <div className="label bg-paper-2 text-muted flex aspect-[4/5] items-center justify-center">
        No image available
      </div>
    );
  }

  return (
    <div>
      <ImageReveal onMount delay={0.1}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-cursor="Zoom"
          aria-label={`Open ${title} full screen`}
          className="group relative block w-full"
        >
          <div
            className="relative mx-auto w-full"
            style={{ aspectRatio: `${current.width} / ${current.height}`, maxHeight: "82svh" }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className="absolute inset-0"
              >
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  priority={index === 0}
                  quality={90}
                  sizes="(min-width: 1024px) 62vw, 100vw"
                  placeholder={current.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={current.blurDataUrl ?? undefined}
                  className="object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <span className="bg-paper/80 absolute right-4 bottom-4 flex size-10 items-center justify-center rounded-full opacity-0 backdrop-blur transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
            <Maximize2 className="size-4" />
          </span>
        </button>
      </ImageReveal>

      {images.length > 1 && (
        <div className="mt-5 flex items-center gap-3">
          <div className="flex flex-1 gap-3 overflow-x-auto pb-1" data-lenis-prevent-horizontal>
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "bg-paper-2 relative h-20 shrink-0 overflow-hidden transition-opacity duration-500",
                  i === index ? "opacity-100" : "opacity-40 hover:opacity-80",
                )}
                style={{ aspectRatio: `${img.width} / ${img.height}` }}
              >
                <Image src={img.src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
          <span className="label text-muted shrink-0">
            {padIndex(index + 1)} / {padIndex(images.length)}
          </span>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <Lightbox
            images={images}
            index={index}
            title={title}
            onClose={() => setOpen(false)}
            onNavigate={go}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Lightbox({
  images,
  index,
  title,
  onClose,
  onNavigate,
}: {
  images: ImageDTO[];
  index: number;
  title: string;
  onClose: () => void;
  onNavigate: (dir: 1 | -1) => void;
}) {
  const lenis = useLenis();
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const closeRef = useRef<HTMLButtonElement>(null);
  const image = images[index]!;

  useEffect(() => {
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      lenis?.start();
      document.body.style.overflow = prevOverflow;
    };
  }, [lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) {
        setZoomed(false);
        onNavigate(1);
      }
      if (e.key === "ArrowLeft" && images.length > 1) {
        setZoomed(false);
        onNavigate(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose, onNavigate]);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — full screen`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="bg-paper fixed inset-0 z-[80] flex flex-col"
    >
      <div className="gutter flex h-20 shrink-0 items-center justify-between">
        <p className="label text-muted">
          {title}
          {images.length > 1 && ` — ${padIndex(index + 1)} / ${padIndex(images.length)}`}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="border-line hover:bg-ink hover:text-paper flex size-11 items-center justify-center rounded-full border transition-colors"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>

      <div
        className={cn(
          "relative flex-1 overflow-hidden",
          zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
        )}
        onClick={() => setZoomed((z) => !z)}
        onPointerMove={(e) => {
          if (!zoomed) return;
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(
            `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
          );
        }}
      >
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: zoomed ? 2.2 : 1 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          style={{ transformOrigin: origin }}
          className="absolute inset-4 md:inset-8"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            quality={90}
            sizes="100vw"
            className="object-contain"
          />
        </motion.div>
      </div>

      {images.length > 1 && (
        <div className="gutter flex h-20 shrink-0 items-center justify-center gap-4">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => {
                setZoomed(false);
                onNavigate(dir);
              }}
              className="border-line hover:bg-ink hover:text-paper flex size-11 items-center justify-center rounded-full border transition-colors"
              aria-label={dir === 1 ? "Next image" : "Previous image"}
            >
              {dir === 1 ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </motion.div>,
    document.body,
  );
}
