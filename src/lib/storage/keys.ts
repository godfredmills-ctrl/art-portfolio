const KEY_PATTERN = /^[a-z0-9][a-z0-9/_-]*\.(webp|jpg|jpeg|png|avif)$/i;

/** Rejects path traversal and anything that isn't a key we generated. */
export function isValidKey(key: string): boolean {
  return KEY_PATTERN.test(key) && !key.includes("..") && !key.includes("//");
}

export function contentTypeFor(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "webp":
      return "image/webp";
    case "png":
      return "image/png";
    case "avif":
      return "image/avif";
    default:
      return "image/jpeg";
  }
}
