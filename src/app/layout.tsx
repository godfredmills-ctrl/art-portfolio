import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { getSettings } from "@/lib/data";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

// Every page reads managed content (at minimum, metadata) from the database at request time,
// so nothing is prerendered during `next build`, when the database may be unreachable.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const name = settings.artistName;
  const description =
    settings.seoDescription ??
    settings.heroText ??
    `Portfolio of ${name}${settings.tagline ? ` — ${settings.tagline}` : ""}.`;

  return {
    metadataBase: new URL(await siteUrl()),
    title: {
      default: settings.tagline ? `${name} — ${settings.tagline}` : name,
      template: `%s — ${name}`,
    },
    description,
    applicationName: name,
    authors: [{ name }],
    openGraph: { type: "website", siteName: name, title: name, description, locale: "en_GB" },
    twitter: { card: "summary_large_image", title: name, description },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#f2efe9",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body className="bg-paper text-ink min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
