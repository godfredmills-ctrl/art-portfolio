export type DimensionUnit = "CM" | "IN" | "MM";

export interface DimensionsInput {
  height: number | null;
  width: number | null;
  depth: number | null;
  unit: DimensionUnit;
  dimensionsNote?: string | null;
}

const UNIT_LABEL: Record<DimensionUnit, string> = { CM: "cm", IN: "in", MM: "mm" };

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

/** Formats dimensions as "H × W × D unit", the convention used in catalogues. */
export function formatDimensions(d: DimensionsInput): string | null {
  const note = d.dimensionsNote?.trim();
  if (note) return note;
  const parts = [d.height, d.width, d.depth].filter((v): v is number => v != null && v > 0);
  if (parts.length === 0) return null;
  return `${parts.map(formatNumber).join(" × ")} ${UNIT_LABEL[d.unit]}`;
}

/** "Oil", "Oil and wax", "Oil, wax and pigment". */
export function formatMediums(mediums: string[]): string {
  if (mediums.length === 0) return "";
  if (mediums.length === 1) return mediums[0]!;
  return `${mediums.slice(0, -1).join(", ")} and ${mediums[mediums.length - 1]}`;
}
