/**
 * Idempotent seed, run on every deploy (`npm run db:deploy`):
 *  - ensures the SiteSettings row exists
 *  - creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD if there are no users
 *  - with SEED_DEMO_CONTENT=true and an empty catalogue, adds demo categories and
 *    artworks with generated abstract images so the site can be previewed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type DimensionUnit } from "../src/generated/prisma/client";
import { processAndStoreImage } from "../src/lib/images";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "✗ DATABASE_URL is not set. On Railway, add DATABASE_URL=${{Postgres.DATABASE_URL}} to this service's variables.",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

/** host:port/db for logs, without credentials. */
function describeDatabase(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || 5432}${u.pathname}`;
  } catch {
    return "(DATABASE_URL is not a valid URL)";
  }
}

/** Retries briefly so a database that is still starting up doesn't fail the deploy. */
async function waitForDatabase(attempts = 10, delayMs = 3000) {
  const target = describeDatabase(databaseUrl!);
  for (let i = 1; i <= attempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err as Error).message;
      if (i === attempts) {
        throw new Error(
          `Could not connect to the database at ${target} (${code}). ` +
            "Check that DATABASE_URL on this service points at your Postgres service.",
        );
      }
      console.warn(`… waiting for database at ${target} (${code}), attempt ${i}/${attempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

const demo = process.env.SEED_DEMO_CONTENT === "true";

/* ── Demo content ─────────────────────────────────────────────────────── */

const demoSettings = {
  artistName: "Elara Quinn",
  tagline: "Painter",
  heroText: "Paintings and works on paper about light, distance and the slow erosion of landscape.",
  statementTitle: "On looking slowly",
  statement: [
    "I paint the moment a place stops being a view and becomes a feeling — when the horizon softens, colour thickens, and the edges of things begin to dissolve into weather.",
    "Most of the work begins outdoors, on long walks along the coast where I make small notations in gouache and pencil. Back in the studio these notes are rebuilt slowly, in thin layers of oil and cold wax that are scraped back and repainted until the surface carries something of the time it took to make.",
    "I am interested in the quiet drama of reduction: how few elements a painting needs before it starts to hold the memory of a place. A band of ochre can be a field at dusk; a pale rectangle, the glare of salt flats at noon.",
    "The paintings ask for the same patience they were made with. I hope they reward a slower kind of looking — the kind that lets colour arrive gradually, the way light does at the edge of the day.",
  ].join("\n\n"),
  bio: [
    "Elara Quinn (b. 1988) is a painter working between the studio and the coastline. She studied Fine Art at the Glasgow School of Art and completed an MA in Painting at the Royal College of Art.",
    "Her work has been exhibited in solo and group exhibitions across the UK and Europe and is held in private collections internationally. She lives and works by the sea.",
  ].join("\n\n"),
  email: "studio@example.com",
  location: "Margate, United Kingdom",
  seoDescription:
    "Portfolio of painter Elara Quinn — paintings, works on paper and monotypes exploring light, distance and landscape.",
};

const palettes = {
  salt: ["#e9e3d6", "#d6cab3", "#b4a283", "#857558"],
  dusk: ["#2b2d42", "#8d5b4c", "#d9a273", "#e8d8c3"],
  sea: ["#1f3a4a", "#3f6e7d", "#a7c4c2", "#ece6da"],
  ochre: ["#c9932e", "#7a3b1d", "#efe3c8", "#2a2522"],
  rose: ["#e7c9bd", "#b5655a", "#3d2c2e", "#f4ece2"],
  moss: ["#3b4a35", "#8a9468", "#d6d0b5", "#1d1f1a"],
  blue: ["#1c2b5a", "#3d5a98", "#e2dccb", "#c45a3c"],
  ink: ["#f1ece2", "#1b1b1b", "#9b2f24", "#6d6a63"],
} satisfies Record<string, string[]>;

type Style = "fields" | "bands" | "orbs" | "grid" | "gesture";

interface DemoWork {
  title: string;
  year: number;
  category: string;
  mediums: string[];
  h: number;
  w: number;
  d?: number;
  unit?: DimensionUnit;
  style: Style;
  palette: keyof typeof palettes;
  featured?: boolean;
  description?: string;
}

const categories = [
  {
    name: "Paintings",
    slug: "paintings",
    description: "Oil and cold wax on linen and panel, built slowly in thin, scraped-back layers.",
  },
  {
    name: "Works on Paper",
    slug: "works-on-paper",
    description: "Notations made outdoors — gouache, ink, charcoal and pastel.",
  },
  {
    name: "Monotypes",
    slug: "monotypes",
    description: "Unique prints pulled by hand from painted plates.",
  },
];

const works: DemoWork[] = [
  {
    title: "Salt Field I",
    year: 2025,
    category: "paintings",
    mediums: ["Oil", "Cold wax", "Linen"],
    h: 150,
    w: 120,
    style: "fields",
    palette: "salt",
    featured: true,
    description:
      "The first of a series made after a winter spent walking the salt marshes. The upper field was scraped back and repainted eleven times.",
  },
  {
    title: "Meridian",
    year: 2025,
    category: "paintings",
    mediums: ["Acrylic", "Pigment", "Canvas"],
    h: 180,
    w: 140,
    style: "orbs",
    palette: "blue",
    featured: true,
  },
  {
    title: "Low Tide, Evening",
    year: 2024,
    category: "paintings",
    mediums: ["Oil", "Canvas"],
    h: 90,
    w: 120,
    style: "bands",
    palette: "dusk",
    featured: true,
    description:
      "Painted from a sequence of small gouache notes made over a single week in October.",
  },
  {
    title: "Salt Field II",
    year: 2025,
    category: "paintings",
    mediums: ["Oil", "Cold wax", "Linen"],
    h: 150,
    w: 120,
    style: "fields",
    palette: "rose",
  },
  {
    title: "The Long Room",
    year: 2023,
    category: "paintings",
    mediums: ["Oil", "Linen"],
    h: 200,
    w: 160,
    style: "fields",
    palette: "moss",
    featured: true,
  },
  {
    title: "Small Hours",
    year: 2023,
    category: "paintings",
    mediums: ["Oil", "Panel"],
    h: 40,
    w: 30,
    style: "gesture",
    palette: "ochre",
  },
  {
    title: "Study for a Horizon",
    year: 2025,
    category: "works-on-paper",
    mediums: ["Gouache", "Graphite", "Paper"],
    h: 29.7,
    w: 42,
    style: "bands",
    palette: "sea",
    featured: true,
  },
  {
    title: "Weather Report",
    year: 2024,
    category: "works-on-paper",
    mediums: ["Charcoal", "Pastel", "Paper"],
    h: 76,
    w: 56,
    style: "gesture",
    palette: "ink",
    featured: true,
  },
  {
    title: "Notation 4",
    year: 2024,
    category: "works-on-paper",
    mediums: ["Ink", "Watercolour", "Paper"],
    h: 30,
    w: 24,
    style: "grid",
    palette: "ochre",
  },
  {
    title: "Notation 7",
    year: 2024,
    category: "works-on-paper",
    mediums: ["Ink", "Watercolour", "Paper"],
    h: 30,
    w: 24,
    style: "grid",
    palette: "blue",
  },
  {
    title: "Echo (Blue)",
    year: 2025,
    category: "monotypes",
    mediums: ["Monotype", "Oil-based ink", "Somerset paper"],
    h: 56,
    w: 76,
    style: "orbs",
    palette: "sea",
    featured: true,
  },
  {
    title: "Echo (Ochre)",
    year: 2025,
    category: "monotypes",
    mediums: ["Monotype", "Oil-based ink", "Somerset paper"],
    h: 56,
    w: 76,
    style: "orbs",
    palette: "ochre",
  },
  {
    title: "Unnamed Coast",
    year: 2022,
    category: "monotypes",
    mediums: ["Monotype", "Oil-based ink", "Somerset paper"],
    h: 50,
    w: 70,
    style: "bands",
    palette: "moss",
  },
];

/* ── Generative images ────────────────────────────────────────────────── */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function renderSvg(style: Style, colors: string[], W: number, H: number, seed: number): string {
  const r = mulberry32(seed);
  const [c0, c1, c2, c3] = colors as [string, string, string, string];
  const rand = (a: number, b: number) => a + r() * (b - a);
  const shapes: string[] = [];

  switch (style) {
    case "fields": {
      const m = W * 0.08;
      const split = rand(0.5, 0.62);
      shapes.push(
        `<rect x="${m}" y="${H * 0.07}" width="${W - 2 * m}" height="${H * split - H * 0.07}" fill="${c1}" filter="url(#rough)"/>`,
        `<rect x="${m}" y="${H * split + H * 0.03}" width="${W - 2 * m}" height="${H * (0.93 - split - 0.03)}" fill="${c2}" filter="url(#rough)"/>`,
        `<rect x="${m}" y="${H * split - H * 0.012}" width="${W - 2 * m}" height="${H * 0.03}" fill="${c3}" opacity="0.55" filter="url(#rough)"/>`,
      );
      break;
    }
    case "bands": {
      let y = 0;
      const palette = [c0, c1, c2, c3];
      let i = 0;
      while (y < H) {
        const h = H * rand(0.08, 0.3);
        shapes.push(
          `<rect x="-40" y="${y}" width="${W + 80}" height="${h + 20}" fill="${palette[i % 4]}" filter="url(#rough)"/>`,
        );
        y += h;
        i++;
      }
      shapes.push(
        `<circle cx="${W * rand(0.25, 0.75)}" cy="${H * rand(0.2, 0.4)}" r="${Math.min(W, H) * rand(0.06, 0.12)}" fill="${c3}" opacity="0.85" filter="url(#soft)"/>`,
      );
      break;
    }
    case "orbs": {
      const R = Math.min(W, H) * rand(0.28, 0.36);
      const cx = W * rand(0.4, 0.6);
      const cy = H * rand(0.38, 0.5);
      shapes.push(
        `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${c1}" filter="url(#rough)"/>`,
        `<circle cx="${cx + R * rand(0.4, 0.7)}" cy="${cy + R * rand(0.3, 0.6)}" r="${R * rand(0.45, 0.65)}" fill="${c3}" opacity="0.9" filter="url(#rough)"/>`,
        `<path d="M ${cx - R * 1.3} ${cy + R * 1.25} A ${R * 0.9} ${R * 0.9} 0 0 1 ${cx + R * 0.5} ${cy + R * 1.25} Z" fill="${c2}" filter="url(#rough)"/>`,
        `<line x1="${W * 0.08}" y1="${H * 0.86}" x2="${W * 0.92}" y2="${H * 0.86}" stroke="${c2}" stroke-width="${W * 0.004}" opacity="0.7"/>`,
      );
      break;
    }
    case "grid": {
      const cols = 3;
      const rows = 4;
      const pad = W * 0.1;
      const cw = (W - pad * 2) / cols;
      const ch = (H - pad * 2) / rows;
      const fills = [c0, c1, c3];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = pad + i * cw + cw / 2;
          const y = pad + j * ch + ch / 2;
          const s = Math.min(cw, ch) * 0.34;
          const fill = fills[Math.floor(r() * fills.length)];
          const kind = Math.floor(r() * 3);
          if (kind === 0)
            shapes.push(
              `<circle cx="${x}" cy="${y}" r="${s}" fill="${fill}" filter="url(#rough)"/>`,
            );
          else if (kind === 1)
            shapes.push(
              `<rect x="${x - s}" y="${y - s}" width="${s * 2}" height="${s * 2}" fill="${fill}" filter="url(#rough)"/>`,
            );
          else
            shapes.push(
              `<path d="M ${x - s} ${y + s * 0.4} A ${s} ${s} 0 0 1 ${x + s} ${y + s * 0.4} Z" fill="${fill}" filter="url(#rough)"/>`,
            );
        }
      }
      return wrap(W, H, c2, shapes.join(""), seed);
    }
    case "gesture": {
      for (let i = 0; i < 6; i++) {
        const pts = Array.from({ length: 4 }, () => [rand(-0.1, 1.1) * W, rand(0.05, 0.95) * H]);
        const [a, b, c, d] = pts as [number[], number[], number[], number[]];
        shapes.push(
          `<path d="M ${a[0]} ${a[1]} C ${b[0]} ${b[1]}, ${c[0]} ${c[1]}, ${d[0]} ${d[1]}" stroke="${[c1, c2, c3][i % 3]}" stroke-width="${W * rand(0.03, 0.12)}" stroke-linecap="round" fill="none" opacity="${rand(0.55, 0.95)}" filter="url(#rough)"/>`,
        );
      }
      break;
    }
  }
  return wrap(W, H, c0, shapes.join(""), seed);
}

function wrap(W: number, H: number, bg: string, body: string, seed: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="${seed}" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="${Math.round(W * 0.025)}" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
      <feGaussianBlur in="displaced" stdDeviation="${(W * 0.0025).toFixed(1)}"/>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="${Math.round(W * 0.01)}"/></filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed + 7}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${bg}"/>
  ${body}
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.09"/>
</svg>`;
}

async function generateImage(work: DemoWork, seed: number) {
  const long = 1600;
  const ratio = work.w / work.h;
  const W = Math.round(ratio >= 1 ? long : long * ratio);
  const H = Math.round(ratio >= 1 ? long / ratio : long);
  const svg = renderSvg(work.style, palettes[work.palette], W, H, seed);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return processAndStoreImage(png, "artworks");
}

/* ── Seed ─────────────────────────────────────────────────────────────── */

async function seedSettings() {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...(demo ? demoSettings : {}) },
    update: {},
  });
}

async function seedAdmin() {
  if ((await prisma.user.count()) > 0) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("⚠ No users exist and ADMIN_EMAIL / ADMIN_PASSWORD are not set — skipping admin.");
    return;
  }
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
  }
  await prisma.user.create({
    data: {
      email,
      name: demo ? demoSettings.artistName : null,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log(`✓ Created admin user ${email}`);
}

async function seedDemo() {
  if (!demo) return;
  if ((await prisma.artwork.count()) > 0) {
    console.log("• Artworks already exist — skipping demo content.");
    return;
  }

  const categoryIds: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const saved = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { ...c, sortOrder: i },
      update: {},
    });
    categoryIds[c.slug] = saved.id;
  }

  for (const [i, work] of works.entries()) {
    const image = await generateImage(work, 1000 + i * 97);
    await prisma.artwork.create({
      data: {
        title: work.title,
        slug: work.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        year: work.year,
        height: work.h,
        width: work.w,
        depth: work.d,
        unit: work.unit ?? "CM",
        description: work.description,
        featured: work.featured ?? false,
        published: true,
        sortOrder: i,
        category: { connect: { id: categoryIds[work.category]! } },
        mediums: {
          create: work.mediums.map((name, position) => ({
            position,
            medium: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
        images: { create: { ...image, alt: work.title, sortOrder: 0 } },
      },
    });
    console.log(`  ✓ ${work.title}`);
  }
  console.log(`✓ Seeded ${works.length} demo artworks`);
}

async function main() {
  await waitForDatabase();
  await seedSettings();
  await seedAdmin();
  await seedDemo();
}

main()
  .catch((err) => {
    console.error(`✗ Seed failed: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
