import { randomUUID } from "node:crypto";
import { storage } from "./storage";

export const MAX_CV_BYTES = 15 * 1024 * 1024;

export class DocumentError extends Error {}

/** True if the bytes start with a PDF header (allowing a little leading junk, as the spec does). */
export function isPdf(bytes: Uint8Array): boolean {
  const head = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
  return head.includes("%PDF-");
}

/** Keeps a readable display name without anything that could break a header or path. */
export function cleanFileName(name: string): string {
  const base = name
    .replace(/\.pdf$/i, "")
    .replace(/[^\p{L}\p{N} ._()-]+/gu, " ")
    .trim();
  return `${(base || "CV").slice(0, 100)}.pdf`;
}

export async function storeCv(bytes: Buffer): Promise<{ key: string; size: number }> {
  if (bytes.byteLength === 0) throw new DocumentError("The file is empty");
  if (bytes.byteLength > MAX_CV_BYTES) throw new DocumentError("The CV must be 15 MB or smaller");
  if (!isPdf(bytes)) throw new DocumentError("Please upload your CV as a PDF");

  const key = `documents/cv-${randomUUID()}.pdf`;
  await storage().put(key, bytes, "application/pdf");
  return { key, size: bytes.byteLength };
}

/** Download name like "Emmanuel-Agyen-Mills-CV.pdf". */
export function cvDownloadName(artistName: string): string {
  const slug = artistName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "Artist"}-CV.pdf`;
}
