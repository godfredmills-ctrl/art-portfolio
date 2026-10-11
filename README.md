# Art Portfolio

A portfolio site for an artist with a built-in admin for managing all content:
artworks (title, dimensions, mediums, year, images), categories, the artist statement,
biography and contact details.

**Stack:** Next.js 16 (App Router, Server Actions) · React 19 · PostgreSQL + Prisma 7 ·
Tailwind CSS 4 · Motion · Lenis smooth scroll · sharp image processing · deployed on Railway.

## Features

**Public site**

- Home: animated hero, scroll-lit statement excerpt, pinned horizontal gallery of featured works, category index with floating previews
- Works: filterable gallery by category (shareable `?category=` URLs), masonry layout, image reveals
- Artwork pages: zoomable full-screen viewer, multiple images, catalogue details, enquiry link, previous/next navigation, related works
- Statement page with portrait, statement and biography
- Smooth scrolling, page transitions, custom cursor, `prefers-reduced-motion` support
- SEO: per-page metadata, Open Graph images, `sitemap.xml`, `robots.txt`, schema.org `VisualArtwork` JSON-LD

**Admin (`/admin`)**

- Artworks: create, edit, delete; publish/draft and feature toggles; drag-and-drop ordering; search and filters
- Multi-image upload with progress, drag-to-reorder, cover selection and alt text
- Images are auto-oriented, converted to sRGB, resized and stored as high-quality WebP with blur placeholders
- Mediums as ordered tags with suggestions; dimensions as H × W × D in cm, in or mm, or a free-text override
- Categories: create, edit, delete, reorder
- Statement & site: statement, bio, portrait, home-page intro, contact links, SEO description
- Account: change email/name and password (signs out other sessions)

**Security & quality**

- Signed, `httpOnly` JWT sessions (jose), bcrypt password hashing, rate-limited login
- Every server action and API route re-checks the session against the database
- Zod validation on all inputs, upload type/size checks, path-traversal-safe storage keys
- Security headers (CSP, HSTS, frame protection, nosniff), admin excluded from indexing
- ESLint, strict TypeScript, Vitest unit tests, GitHub Actions CI

## Local development

Requirements: Node 22+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:setup            # apply migrations + seed (set SEED_DEMO_CONTENT=true for demo works)
npm run dev
```

Open http://localhost:3000, and http://localhost:3000/admin to sign in.

No local Postgres? `npx prisma dev` starts a local Prisma Postgres server and prints a
`postgres://` URL you can use as `DATABASE_URL`.

| Script                                | Purpose                                                        |
| ------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                         | Development server                                             |
| `npm run build` / `npm start`         | Production build / server                                      |
| `npm run lint` · `typecheck` · `test` | Quality checks (also run in CI)                                |
| `npm run db:migrate`                  | Create a new migration after editing `prisma/schema.prisma`    |
| `npm run db:deploy`                   | Apply migrations                                               |
| `npm run db:seed`                     | Idempotent seed (settings, first admin, optional demo content) |
| `npm run db:studio`                   | Browse the database                                            |

## Deploying to Railway

`railway.json` already configures the build, the start command and a health check on
`/api/health`. On every start the app applies any pending migrations, runs the idempotent
seed, then starts Next.js (`npm run start:prod`).

1. **Create a project** in Railway and add a **PostgreSQL** database.
2. **Add a service from this GitHub repo.**
3. **Add media storage**, choosing one of:
   - **Volume (simplest):** on the app service, add a Volume mounted at `/data`, then set `STORAGE_DRIVER=local` and `UPLOAD_DIR=/data/uploads`.
   - **Bucket / S3:** set `STORAGE_DRIVER=s3` plus `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (and `S3_FORCE_PATH_STYLE=true` if your provider needs it). Works with Railway Buckets, AWS S3, Cloudflare R2 and others. The bucket can stay private, because images are served through the app at `/media/...`.
4. **Set variables** on the app service:

   | Variable            | Value                                                                                      |
   | ------------------- | ------------------------------------------------------------------------------------------ |
   | `DATABASE_URL`      | `${{Postgres.DATABASE_URL}}`                                                               |
   | `AUTH_SECRET`       | output of `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
   | `ADMIN_EMAIL`       | your login email                                                                           |
   | `ADMIN_PASSWORD`    | at least 10 characters (used only to create the first account)                             |
   | `SITE_URL`          | your public URL, e.g. `https://yourname.art` (optional; defaults to the Railway domain)    |
   | `SEED_DEMO_CONTENT` | `true` to start with demo works, otherwise omit                                            |

5. **Generate a domain** under Settings → Networking (or add your custom domain).
6. Deploy, then sign in at `/admin`. Change the password from **Account**, and remove `ADMIN_PASSWORD` from the variables if you like, since it's only read when no users exist.

To start fresh after trying the demo content, delete the demo artworks and categories in the admin.

## Project structure

```
prisma/                 schema, migrations, seed (with generative demo images)
src/app/(site)/         public pages: home, works, works/[slug], statement
src/app/admin/          admin login and dashboard pages
src/app/api/            health check and authenticated image upload
src/app/media/          serves stored images from the active storage driver
src/components/site/    public UI and animation components
src/components/admin/   admin UI: forms, tables, uploader, sortable lists
src/server/actions/     server actions (all writes), each re-checks auth
src/lib/                db client, auth, storage drivers, validation, data access
src/proxy.ts            redirects signed-out visitors away from /admin
```

## Notes

- Login rate limiting is in-memory, which suits a single Railway instance. Use a shared store such as Redis if you scale to multiple replicas.
- Uploaded images are kept at up to 3000px on the long edge; `next/image` serves responsive WebP sizes from these masters.
