import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageReveal, Reveal, RevealText } from "@/components/site/reveal";
import { getSettings } from "@/lib/data";
import { cn, paragraphs } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Artist Statement",
    description: paragraphs(settings.statement)[0]?.slice(0, 160),
    alternates: { canonical: "/statement" },
  };
}

export default async function StatementPage() {
  const settings = await getSettings();
  const [lead, ...body] = paragraphs(settings.statement);
  const bio = paragraphs(settings.bio);
  const portrait = settings.portrait;
  const [titleFirst, ...titleRest] = (settings.statementTitle ?? "Artist statement").split(" ");

  return (
    <div className="gutter pt-36 pb-28 md:pt-48 md:pb-40">
      <header className="mb-20 md:mb-28">
        <p className="label text-muted mb-6">Artist statement</p>
        <h1 className="max-w-6xl font-serif text-[clamp(3.5rem,9vw,9rem)] leading-[0.88] tracking-[-0.02em]">
          <RevealText text={titleFirst ?? ""} onMount className="block" />
          {titleRest.length > 0 && (
            <RevealText text={titleRest.join(" ")} onMount delay={0.15} className="block italic" />
          )}
        </h1>
      </header>

      <div className="grid grid-cols-12 gap-x-4 gap-y-16 lg:gap-x-12">
        {portrait && (
          <div className="col-span-12 md:col-span-5 lg:col-span-4">
            <div className="md:sticky md:top-28">
              <ImageReveal className="bg-paper-2">
                <div
                  className="relative w-full"
                  style={{ aspectRatio: `${portrait.width} / ${portrait.height}` }}
                >
                  <Image
                    src={portrait.src}
                    alt={portrait.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 768px) 40vw, 100vw"
                    placeholder={portrait.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={portrait.blurDataUrl ?? undefined}
                    className="object-cover"
                  />
                </div>
              </ImageReveal>
              <p className="label text-muted mt-3">
                {settings.artistName}
                {settings.location && ` — ${settings.location}`}
              </p>
            </div>
          </div>
        )}

        <div
          className={cn(
            "col-span-12",
            portrait
              ? "md:col-span-7 lg:col-span-7 lg:col-start-6"
              : "lg:col-span-8 lg:col-start-3",
          )}
        >
          {lead ? (
            <>
              <Reveal>
                <p className="font-serif text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.15] tracking-[-0.01em]">
                  {lead}
                </p>
              </Reveal>
              <div className="text-ink-2 mt-12 max-w-2xl space-y-6 text-lg leading-relaxed">
                {body.map((p, i) => (
                  <Reveal key={i} delay={0.05}>
                    <p>{p}</p>
                  </Reveal>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted">The artist statement hasn’t been written yet.</p>
          )}

          {bio.length > 0 && (
            <section className="border-line mt-24 border-t pt-10 md:mt-32">
              <h2 className="label text-muted mb-8">Biography</h2>
              <div className="text-ink-2 max-w-2xl space-y-5 leading-relaxed">
                {bio.map((p, i) => (
                  <Reveal key={i}>
                    <p>{p}</p>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <Reveal className="mt-20">
            <Link
              href="/works"
              data-cursor="Enter"
              className="group inline-flex items-center gap-4 font-serif text-4xl md:text-5xl"
            >
              <span className="link-underline">View the works</span>
              <ArrowRight className="size-8 transition-transform duration-700 group-hover:translate-x-2" />
            </Link>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
