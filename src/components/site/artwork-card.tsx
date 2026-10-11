import Image from "next/image";
import Link from "next/link";
import type { ArtworkDTO } from "@/lib/data";
import { formatMediums } from "@/lib/format";
import { ImageReveal } from "./reveal";

export function ArtworkCard({
  artwork,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  delay = 0,
}: {
  artwork: ArtworkDTO;
  sizes?: string;
  delay?: number;
}) {
  const cover = artwork.cover;

  return (
    <Link href={`/works/${artwork.slug}`} data-cursor="View" className="group block">
      <ImageReveal delay={delay} className="bg-paper-2">
        <div
          className="relative w-full"
          style={{ aspectRatio: cover ? `${cover.width} / ${cover.height}` : "4 / 5" }}
        >
          {cover ? (
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes={sizes}
              placeholder={cover.blurDataUrl ? "blur" : "empty"}
              blurDataURL={cover.blurDataUrl ?? undefined}
              className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.035]"
            />
          ) : (
            <div className="label text-muted absolute inset-0 flex items-center justify-center">
              No image
            </div>
          )}
        </div>
      </ImageReveal>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-2xl leading-tight">
            <span className="link-underline">{artwork.title}</span>
          </h3>
          {artwork.mediums.length > 0 && (
            <p className="text-muted mt-1 truncate text-sm">{formatMediums(artwork.mediums)}</p>
          )}
        </div>
        <span className="label text-muted shrink-0 pt-1.5">{artwork.year}</span>
      </div>
    </Link>
  );
}
