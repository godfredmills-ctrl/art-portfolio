import Link from "next/link";
import type { SettingsDTO } from "@/lib/data";
import { BackToTop } from "./back-to-top";
import { Reveal, RevealText } from "./reveal";

function instagramUrl(handle: string) {
  if (/^https?:\/\//.test(handle)) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export function Footer({ settings }: { settings: SettingsDTO }) {
  const year = new Date().getFullYear();
  const { email, instagram, website, location, artistName } = settings;

  return (
    <footer id="contact" className="bg-ink text-paper relative overflow-hidden">
      <div className="gutter pt-28 pb-10 md:pt-40">
        <p className="label text-paper/50">Contact</p>

        <RevealText
          as="h2"
          text="Let’s talk about the work."
          className="mt-6 max-w-5xl font-serif text-[clamp(3rem,8vw,8.5rem)] leading-[0.95] tracking-tight"
        />

        {email && (
          <Reveal delay={0.2} className="mt-12">
            <a
              href={`mailto:${email}`}
              className="link-underline font-serif text-3xl italic md:text-5xl"
              data-cursor="Write"
            >
              {email}
            </a>
          </Reveal>
        )}

        <div className="border-paper/15 mt-24 grid gap-10 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {location && (
            <div>
              <p className="label text-paper/50">Studio</p>
              <p className="mt-3 text-lg">{location}</p>
            </div>
          )}
          {(instagram || website) && (
            <div>
              <p className="label text-paper/50">Elsewhere</p>
              <ul className="mt-3 space-y-1 text-lg">
                {instagram && (
                  <li>
                    <a
                      href={instagramUrl(instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline"
                    >
                      Instagram
                    </a>
                  </li>
                )}
                {website && (
                  <li>
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline"
                    >
                      Website
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
          <div>
            <p className="label text-paper/50">Index</p>
            <ul className="mt-3 space-y-1 text-lg">
              <li>
                <Link href="/works" className="link-underline">
                  Works
                </Link>
              </li>
              <li>
                <Link href="/statement" className="link-underline">
                  Statement
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex items-start lg:justify-end">
            <BackToTop />
          </div>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none select-none">
        <p className="text-paper/[0.07] -mb-[0.22em] text-center font-serif text-[17vw] leading-none whitespace-nowrap">
          {artistName}
        </p>
      </div>

      <div className="gutter border-paper/15 text-paper/50 flex flex-col justify-between gap-2 border-t py-6 sm:flex-row">
        <p className="label">
          © {year} {artistName}
        </p>
        <p className="label">All works and images reserved</p>
      </div>
    </footer>
  );
}
