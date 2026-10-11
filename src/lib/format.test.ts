import { describe, expect, it } from "vitest";
import { formatDimensions, formatMediums } from "./format";

describe("formatDimensions", () => {
  it("formats height × width with unit", () => {
    expect(formatDimensions({ height: 150, width: 120, depth: null, unit: "CM" })).toBe(
      "150 × 120 cm",
    );
  });

  it("includes depth and trims trailing zeros", () => {
    expect(formatDimensions({ height: 29.7, width: 42, depth: 2.5, unit: "IN" })).toBe(
      "29.7 × 42 × 2.5 in",
    );
  });

  it("prefers the free-text note", () => {
    expect(
      formatDimensions({
        height: 10,
        width: 10,
        depth: null,
        unit: "CM",
        dimensionsNote: "Dimensions variable",
      }),
    ).toBe("Dimensions variable");
  });

  it("returns null when nothing is set", () => {
    expect(formatDimensions({ height: null, width: null, depth: null, unit: "CM" })).toBeNull();
  });
});

describe("formatMediums", () => {
  it("joins in the given order", () => {
    expect(formatMediums([])).toBe("");
    expect(formatMediums(["Oil"])).toBe("Oil");
    expect(formatMediums(["Oil", "Linen"])).toBe("Oil and Linen");
    expect(formatMediums(["Oil", "Cold wax", "Linen"])).toBe("Oil, Cold wax and Linen");
  });
});
