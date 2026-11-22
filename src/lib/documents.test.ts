import { describe, expect, it } from "vitest";
import { cleanFileName, cvDownloadName, isPdf } from "./documents";
import { formatBytes } from "./format";
import { contentTypeFor, isValidKey } from "./storage/keys";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("isPdf", () => {
  it("accepts PDF headers and rejects other files", () => {
    expect(isPdf(bytes("%PDF-1.7\n..."))).toBe(true);
    expect(isPdf(bytes("\n\r%PDF-1.4"))).toBe(true);
    expect(isPdf(bytes("PK\u0003\u0004 word document"))).toBe(false);
    expect(isPdf(bytes("<html>%PDF-</html>".padStart(2000, " ")))).toBe(false);
  });
});

describe("file names", () => {
  it("cleans uploaded names for display", () => {
    expect(cleanFileName("My CV 2026.pdf")).toBe("My CV 2026.pdf");
    expect(cleanFileName('evil"name\r\n.PDF')).toBe("evil name.pdf");
    expect(cleanFileName(".pdf")).toBe("CV.pdf");
  });

  it("builds a friendly download name", () => {
    expect(cvDownloadName("Emmanuel Agyen Mills")).toBe("Emmanuel-Agyen-Mills-CV.pdf");
    expect(cvDownloadName("Zoë Ångström")).toBe("Zoe-Angstrom-CV.pdf");
    expect(cvDownloadName("")).toBe("Artist-CV.pdf");
  });
});

describe("document storage keys", () => {
  it("allows PDF keys and serves them as PDFs", () => {
    expect(isValidKey("documents/cv-0b4c9a6e.pdf")).toBe(true);
    expect(isValidKey("documents/../cv.pdf")).toBe(false);
    expect(contentTypeFor("documents/cv-1.pdf")).toBe("application/pdf");
  });

  it("formats sizes", () => {
    expect(formatBytes(500)).toBe("1 KB");
    expect(formatBytes(840 * 1024)).toBe("840 KB");
    expect(formatBytes(2.4 * 1024 * 1024)).toBe("2.4 MB");
  });
});
