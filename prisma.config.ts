import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` doesn't need a live database, so builds may run without
// DATABASE_URL. Every other command (migrate, seed, studio) needs the real one.
const isGenerate = process.argv.includes("generate");
if (!process.env.DATABASE_URL && !isGenerate) {
  throw new Error(
    "DATABASE_URL is not set. On Railway, add DATABASE_URL=${{Postgres.DATABASE_URL}} " +
      "to this service's variables (use your Postgres service's name if it isn't 'Postgres').",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/placeholder",
  },
});
