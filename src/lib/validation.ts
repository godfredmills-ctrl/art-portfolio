import { z } from "zod";

/** Trimmed optional text; empty strings become null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .nullish()
    .transform((v) => (v ? v : null));

const optionalDimension = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n) || n <= 0 || n >= 1_000_000) {
      ctx.addIssue({ code: "custom", message: "Enter a positive number" });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100;
  });

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only");

export const imageInputSchema = z.object({
  id: z.string().optional(),
  key: z
    .string()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9/_-]+\.(webp|jpg|png)$/i, "Invalid image key"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataUrl: z.string().max(10_000).nullish(),
  alt: z.string().trim().max(300).nullish(),
});

export type ImageInput = z.infer<typeof imageInputSchema>;

const maxYear = new Date().getFullYear() + 1;

export const artworkSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.union([slugSchema, z.literal("")]).optional(),
  year: z.coerce
    .number({ error: "Year is required" })
    .int("Enter a whole year")
    .min(1000, "Enter a valid year")
    .max(maxYear, "Year can't be in the future"),
  categoryId: optionalText(50),
  mediums: z
    .array(z.string().trim().min(1).max(80))
    .max(20, "Up to 20 mediums")
    .transform((list) => {
      const seen = new Set<string>();
      return list.filter((m) => {
        const k = m.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }),
  height: optionalDimension,
  width: optionalDimension,
  depth: optionalDimension,
  unit: z.enum(["CM", "IN", "MM"]).default("CM"),
  dimensionsNote: optionalText(120),
  description: optionalText(5000),
  published: z.boolean(),
  featured: z.boolean(),
  images: z.array(imageInputSchema).max(30, "Up to 30 images per artwork"),
});

export type ArtworkInput = z.infer<typeof artworkSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: z.union([slugSchema, z.literal("")]).optional(),
  description: optionalText(500),
});

export const settingsSchema = z.object({
  artistName: z.string().trim().min(1, "Name is required").max(120),
  tagline: optionalText(200),
  heroText: optionalText(300),
  statementTitle: optionalText(120),
  statement: optionalText(20000),
  bio: optionalText(5000),
  email: z
    .union([z.email("Enter a valid email"), z.literal("")])
    .nullish()
    .transform((v) => v || null),
  location: optionalText(120),
  instagram: optionalText(120),
  website: z
    .union([z.url("Enter a valid URL, including https://"), z.literal("")])
    .nullish()
    .transform((v) => v || null),
  seoDescription: optionalText(300),
  portrait: imageInputSchema.nullish(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Password is required").max(200),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(10, "Use at least 10 characters")
      .max(200)
      .regex(/[a-zA-Z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export const profileSchema = z.object({
  name: optionalText(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
});

/** Flattens zod issues into a field → message map for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
