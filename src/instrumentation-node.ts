import { env } from "./lib/env";

// Validate configuration up front so a missing or invalid variable stops the
// deploy with a clear message, instead of every page failing later with a
// generic error.
try {
  env();
} catch (err) {
  console.error(`\n✗ ${(err as Error).message}\n`);
  process.exit(1);
}
