/**
 * Runs once when the server boots. Node-only checks live in a separate module
 * so they aren't bundled for the edge runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
