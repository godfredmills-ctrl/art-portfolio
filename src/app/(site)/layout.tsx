import { Cursor } from "@/components/site/cursor";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { getSettings } from "@/lib/data";

// Content is managed in the admin and read from Postgres on each request.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <SmoothScroll>
      <div>
        <a
          href="#main"
          className="label bg-ink text-paper sr-only fixed top-4 left-4 z-[100] px-4 py-3 focus:not-sr-only"
        >
          Skip to content
        </a>
        <Header name={settings.artistName} />
        <main id="main">{children}</main>
        <Footer settings={settings} />
        <Cursor />
      </div>
    </SmoothScroll>
  );
}
