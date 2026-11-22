import { ArrowUpRight, Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal, RevealText } from "@/components/site/reveal";
import { getSettings } from "@/lib/data";
import { formatBytes } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "CV",
    description: `Curriculum vitae of ${settings.artistName}.`,
    alternates: { canonical: "/cv" },
  };
}

export default async function CvPage() {
  const settings = await getSettings();
  const cv = settings.cv;
  if (!cv) notFound();

  const updated = cv.updatedAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="gutter pt-36 pb-28 md:pt-48 md:pb-40">
      <header className="mb-14 flex flex-wrap items-end justify-between gap-8 md:mb-20">
        <div>
          <p className="label text-muted mb-6">Curriculum vitae</p>
          <h1 className="font-serif text-[clamp(4.5rem,15vw,14rem)] leading-[0.82] tracking-[-0.02em]">
            <RevealText text="CV" onMount />
          </h1>
        </div>

        <Reveal delay={0.3} className="flex flex-wrap items-center gap-3">
          <a
            href={cv.downloadUrl}
            download
            className="bg-ink text-paper hover:bg-accent inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm transition-colors duration-500"
          >
            <Download className="size-4" />
            Download CV
          </a>
          <a
            href={cv.src}
            target="_blank"
            rel="noopener noreferrer"
            className="border-line hover:border-ink inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm transition-colors duration-500"
          >
            Open in new tab
            <ArrowUpRight className="size-4" />
          </a>
        </Reveal>
      </header>

      <Reveal delay={0.2}>
        <p className="label text-muted border-line mb-6 flex flex-wrap gap-x-6 gap-y-1 border-t pt-4">
          <span>PDF · {formatBytes(cv.size)}</span>
          <span>Updated {updated}</span>
        </p>

        {/* Desktop: the PDF embedded in the page. */}
        <div className="border-line bg-paper-2 hidden overflow-hidden border md:block">
          <iframe
            src={`${cv.src}#view=FitH&toolbar=1`}
            title={`CV of ${settings.artistName}`}
            className="block h-[85svh] w-full"
            data-lenis-prevent
          />
        </div>

        {/* Phones and tablets don't display embedded PDFs reliably. */}
        <div className="border-line flex flex-col items-start gap-6 border p-6 md:hidden">
          <FileText className="text-muted size-10" strokeWidth={1.25} />
          <div>
            <p className="font-serif text-3xl leading-tight">{settings.artistName}</p>
            <p className="text-muted mt-1 text-sm">Curriculum vitae · PDF</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={cv.src}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-ink text-paper inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm"
            >
              View CV <ArrowUpRight className="size-4" />
            </a>
            <a
              href={cv.downloadUrl}
              download
              className="border-line inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm"
            >
              <Download className="size-4" /> Download
            </a>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
