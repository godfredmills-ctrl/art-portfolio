import { describe, expect, it } from "vitest";
import { isValidKey } from "./storage/keys";
import { slugify } from "./utils";
import { artworkSchema, passwordSchema } from "./validation";

const base = {
  title: "  Salt Field I ",
  year: "2025",
  mediums: ["Oil", "oil", "Linen"],
  height: "150",
  width: "120.555",
  depth: "",
  unit: "CM",
  published: true,
  featured: false,
  images: [],
};

describe("artworkSchema", () => {
  it("normalises input", () => {
    const r = artworkSchema.parse(base);
    expect(r.title).toBe("Salt Field I");
    expect(r.year).toBe(2025);
    expect(r.mediums).toEqual(["Oil", "Linen"]);
    expect(r.width).toBe(120.56);
    expect(r.depth).toBeNull();
    expect(r.description).toBeNull();
  });

  it("rejects bad values", () => {
    const r = artworkSchema.safeParse({ ...base, title: "", year: "3000", height: "-1" });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["title", "year", "height"]));
  });

  it("rejects image keys that could traverse paths", () => {
    const r = artworkSchema.safeParse({
      ...base,
      images: [{ key: "../../etc/passwd.png", width: 1, height: 1 }],
    });
    expect(r.success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("requires matching, reasonably strong passwords", () => {
    expect(
      passwordSchema.safeParse({
        currentPassword: "x",
        newPassword: "short1",
        confirmPassword: "short1",
      }).success,
    ).toBe(false);
    expect(
      passwordSchema.safeParse({
        currentPassword: "x",
        newPassword: "longenough123",
        confirmPassword: "different123",
      }).success,
    ).toBe(false);
    expect(
      passwordSchema.safeParse({
        currentPassword: "x",
        newPassword: "longenough123",
        confirmPassword: "longenough123",
      }).success,
    ).toBe(true);
  });
});

describe("helpers", () => {
  it("slugifies titles", () => {
    expect(slugify("Low Tide, Evening")).toBe("low-tide-evening");
    expect(slugify("Échos & Rêves")).toBe("echos-and-reves");
    expect(slugify("  --  ")).toBe("");
  });

  it("validates storage keys", () => {
    expect(isValidKey("artworks/2025/10/abc-123.webp")).toBe(true);
    expect(isValidKey("../secret.webp")).toBe(false);
    expect(isValidKey("artworks//a.webp")).toBe(false);
    expect(isValidKey("artworks/a.svg")).toBe(false);
  });
});
