import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` doesn't need a live database, so fall back to a
    // placeholder to keep builds working when DATABASE_URL isn't present.
    url: process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/placeholder",
  },
});
