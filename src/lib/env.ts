import { z } from "zod";

const AUTH_SECRET_HINT =
  "generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string({ error: "is not set (on Railway: ${{Postgres.DATABASE_URL}})" })
    .min(1, "is empty"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  AUTH_SECRET: z
    .string({ error: `is not set — ${AUTH_SECRET_HINT}` })
    .min(32, `must be at least 32 characters — ${AUTH_SECRET_HINT}`),
  STORAGE_DRIVER: z.enum(["local", "s3"], { error: 'must be "local" or "s3"' }).default("local"),
  UPLOAD_DIR: z.string().default("./.data/uploads"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"], { error: 'must be "true" or "false"' })
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/**
 * Validated server environment. Parsed lazily so `next build`
 * doesn't need runtime secrets to be present; checked at boot by
 * `src/instrumentation.ts`.
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")} ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}

/**
 * Public base URL for metadata, sitemap and structured data. Uses SITE_URL if set,
 * then the Railway domain, then the host of the current request.
 */
export async function siteUrl(): Promise<string> {
  const explicit = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railway) return `https://${railway}`;

  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto.split(",")[0]}://${host}`;
    }
  } catch {
    // Outside a request (e.g. scripts): fall through.
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
