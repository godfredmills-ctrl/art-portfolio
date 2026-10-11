import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkCard } from "@/components/site/artwork-card";
import { ArtworkViewer } from "@/components/site/artwork-viewer";
import { Reveal, RevealText } from "@/components/site/reveal";
import { getArtworkDetail, getSettings, type ArtworkDTO } from "@/lib/data";
import { siteUrl } from "@/lib/env";
import { formatMediums } from "@/lib/format";
import { padIndex, paragraphs } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getArtworkDetail(slug);
  if (!detail) return { title: "Not found" };
  const { artwork } = detail;
  const facts = [artwork.year, formatMediums(artwork.mediums), artwork.dimensions]
    .filter(Boolean)
    .join(" · ");
  const description = artwork.description?.slice(0, 160) ?? facts;

  return {
    title: artwork.title,
    description,
    alternates: { canonical: `/works/${artwork.slug}` },
    openGraph: {
      title: artwork.title,
      description,
      images: artwork.cover
        ? [{ url: artwork.cover.src, width: artwork.cover.width, height: artwork.cover.height }]
        : undefined,
    },
  };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-line grid grid-cols-3 gap-4 border-t py-4">
      <dt className="label text-muted pt-1">{label}</dt>
      <dd className="col-span-2">{children}</dd>
    </div>
  );
}

function NeighbourLink({ artwork, dir }: { artwork: ArtworkDTO; dir: "prev" | "next" }) {
  const isNext = dir === "next";
  return (
    <Link
      href={`/works/${artwork.slug}`}
      data-cursor={isNext ? "Next" : "Prev"}
      className={`group flex items-center gap-6 py-10 md:py-14 ${isNext ? "flex-row-reverse text-right" : ""}`}
    >
      {artwork.cover && (
        <span className="bg-paper-2 relative hidden h-28 w-24 shrink-0 overflow-hidden sm:block">
          <Image
            src={artwork.cover.src}
            alt=""
            fill
            sizes="96px"
            className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-110"
          />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className="label text-muted flex items-center gap-2 data-[next=true]:justify-end"
          data-next={isNext}
        >
          {!isNext && <ArrowLeft className="size-3.5" />}
          {isNext ? "Next" : "Previous"}
          {isNext && <ArrowRight className="size-3.5" />}
        </span>
        <span className="mt-2 block truncate font-serif text-3xl leading-tight transition-transform duration-700 ease-[var(--ease-expo)] md:text-5xl">
          {artwork.title}
        </span>
      </span>
    </Link>
  );
}

export default async function ArtworkPage({ params }: Props) {
  const { slug } = await params;
  const [detail, settings] = await Promise.all([getArtworkDetail(slug), getSettings()]);
  if (!detail) notFound();

  const { artwork, index, total, prev, next, related } = detail;
  const mediums = formatMediums(artwork.mediums);
  const enquiry = settings.email
    ? `mailto:${settings.email}?subject=${encodeURIComponent(`Enquiry: ${artwork.title} (${artwork.year})`)}`
    : null;

  const base = await siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    dateCreated: String(artwork.year),
    artMedium: mediums || undefined,
    artform: artwork.category?.name,
    description: artwork.description ?? undefined,
    image: artwork.images.map((i) => `${base}${i.src}`),
    url: `${base}/works/${artwork.slug}`,
    creator: { "@type": "Person", name: settings.artistName },
  };

  return (
    <article className="pt-28 md:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="gutter grid grid-cols-12 gap-x-4 gap-y-12 lg:gap-x-12">
        <div className="col-span-12 lg:col-span-8">
          <ArtworkViewer images={artwork.images} title={artwork.title} />
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <div className="flex items-center justify-between">
              <Link
                href="/works"
                className="label group text-muted hover:text-ink inline-flex items-center gap-2"
              >
                <ArrowLeft className="size-3.5 transition-transform duration-500 group-hover:-translate-x-1" />
                All works
              </Link>
              <span className="label text-muted">
                No. {padIndex(index + 1)} / {padIndex(total)}
              </span>
            </div>

            <h1 className="mt-10 font-serif text-[clamp(3rem,5vw,4.75rem)] leading-[0.95] tracking-[-0.01em]">
              <RevealText text={artwork.title} onMount delay={0.15} />
            </h1>

            <Reveal delay={0.35}>
              <dl className="border-line mt-10 border-b text-[0.95rem]">
                <Fact label="Year">{artwork.year}</Fact>
                {mediums && <Fact label="Medium">{mediums}</Fact>}
                {artwork.dimensions && <Fact label="Dimensions">{artwork.dimensions}</Fact>}
                {artwork.category && (
                  <Fact label="Series">
                    <Link
                      href={`/works?category=${artwork.category.slug}`}
                      className="link-underline"
                    >
                      {artwork.category.name}
                    </Link>
                  </Fact>
                )}
              </dl>

              {artwork.description && (
                <div className="text-ink-2 mt-8 space-y-4 leading-relaxed">
                  {paragraphs(artwork.description).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}

              {enquiry && (
                <a
                  href={enquiry}
                  className="group bg-ink text-paper hover:bg-accent mt-10 inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm transition-colors duration-500"
                >
                  <Mail className="size-4" />
                  Enquire about this work
                </a>
              )}
            </Reveal>
          </div>
        </aside>
      </div>

      {(prev || next) && (
        <nav
          aria-label="More works"
          className="gutter border-line mt-28 grid border-y md:mt-40 md:grid-cols-2"
        >
          {prev && <NeighbourLink artwork={prev} dir="prev" />}
          {next && (
            <div className="border-line border-t md:border-t-0 md:border-l">
              <NeighbourLink artwork={next} dir="next" />
            </div>
          )}
        </nav>
      )}

      {related.length > 0 && artwork.category && (
        <section className="gutter py-28 md:py-36">
          <div className="mb-14 flex items-end justify-between">
            <h2 className="font-serif text-4xl md:text-6xl">
              More from <em>{artwork.category.name}</em>
            </h2>
            <Link
              href={`/works?category=${artwork.category.slug}`}
              className="label link-underline text-muted hidden sm:inline"
            >
              View series
            </Link>
          </div>
          <div className="grid items-start gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12">
            {related.map((a, i) => (
              <ArtworkCard key={a.id} artwork={a} delay={i * 0.08} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
