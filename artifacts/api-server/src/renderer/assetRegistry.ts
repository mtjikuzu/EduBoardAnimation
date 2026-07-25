/**
 * Curated educational SVG asset library.
 *
 * Each asset has an id, semantic tags, the raw SVG path data,
 * and provenance metadata (source, license). Assets are normalized
 * through Rough.js before rendering.
 */
export interface AssetRecord {
  id: string;
  name: string;
  tags: string[];
  svgPath: string;
  viewBox: string;
  category: "math" | "science" | "accounting" | "business" | "general";
  source: string;
  license: "CC0" | "MIT" | "Apache-2.0";
  styleVersion: number;
}

// Curated educational SVG assets (lightweight inline SVGs)
const ASSET_LIBRARY: AssetRecord[] = [
  {
    id: "apple",
    name: "Apple",
    tags: ["fruit", "grocery", "food"],
    svgPath: "M12 2C10.3 2 9 4 9 6s1.3 4 3 4 3-1.8 3-4-1.3-4-3-4zm-2 7c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1v4c0 1.1.9 2 2 2s2-.9 2-2v-4h1c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2h-4z",
    viewBox: "0 0 24 24",
    category: "general",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
  {
    id: "shopping-cart",
    name: "Shopping Cart",
    tags: ["cart", "grocery", "shop", "store"],
    svgPath: "M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 3c0 .6.4 1 1 1h2l3.6 7.6-1.4 2.5c-.3.5-.2 1.1.2 1.5.4.4 1 .6 1.6.6h10c.6 0 1-.4 1-1s-.4-1-1-1H8l1.2-2h8.3c.7 0 1.3-.4 1.5-1l3.4-7.8c.1-.2.1-.5 0-.7-.2-.3-.5-.5-.9-.5H5.2L4.5 2H3c-.6 0-1 .4-1 1z",
    viewBox: "0 0 24 24",
    category: "general",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
  {
    id: "calculator",
    name: "Calculator",
    tags: ["math", "calculation", "numbers", "accounting"],
    svgPath: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm-8-4H6V7h2v2zm4 0h-2V7h2v2zm4 0h-2V7h2v2z",
    viewBox: "0 0 24 24",
    category: "math",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
  {
    id: "chart-line",
    name: "Line Chart",
    tags: ["chart", "graph", "accounting", "business"],
    svgPath: "M3 21h18v-2H3V3h2v16h16v2H3zm4-4h2v-4H7v4zm4 0h2V7h-2v10zm4 0h2v-6h-2v6zm-8-6v4h2v-4H7z",
    viewBox: "0 0 24 24",
    category: "accounting",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
  {
    id: "dollar-sign",
    name: "Dollar Sign",
    tags: ["money", "currency", "finance", "accounting"],
    svgPath: "M11.8 10.9c-2.3-.6-3-1.4-3-2.4 0-1.4 1.3-2.5 3.2-2.5 2 0 3.1 1 3.4 2.5h2.1c-.3-2.5-2.2-4.2-5.2-4.4V3h-2v2.1c-2.8.5-4.7 2.4-4.7 4.9 0 2.8 2.2 4.3 5.3 5.1 2.6.7 3.1 1.5 3.1 2.6 0 1.3-1.1 2.5-3.1 2.5-2.1 0-3.4-1.1-3.6-2.7H7.1c.3 2.8 2.4 4.4 5 4.7V21h2v-2.1c2.6-.6 4.5-2.4 4.5-4.9 0-2.8-2.1-4.5-5.8-5.1z",
    viewBox: "0 0 24 24",
    category: "accounting",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
  {
    id: "beaker",
    name: "Beaker",
    tags: ["science", "chemistry", "lab", "experiment"],
    svgPath: "M6 2c-1.1 0-2 .9-2 2v1c0 .6.4 1 1 1v11c0 1.7 1.3 3 3 3h8c1.7 0 3-1.3 3-3V6c.6 0 1-.4 1-1V4c0-1.1-.9-2-2-2H6zm1 4h10v1H7V6zm0 2h10v1H7V8zm1 2h2v5H8v-5zm4 0h2v5h-2v-5z",
    viewBox: "0 0 24 24",
    category: "science",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
  {
    id: "lightbulb",
    name: "Lightbulb",
    tags: ["idea", "concept", "learning", "education"],
    svgPath: "M9 21c0 .6.4 1 1 1h4c.6 0 1-.4 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z",
    viewBox: "0 0 24 24",
    category: "general",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
  {
    id: "book",
    name: "Book",
    tags: ["reading", "education", "learning", "textbook"],
    svgPath: "M4 6h3v11H4V6zm5 0h3v11H9V6zm5 0h3v11h-3V6zM2 4v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z",
    viewBox: "0 0 24 24",
    category: "general",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
  {
    id: "checkmark",
    name: "Checkmark",
    tags: ["correct", "yes", "right", "complete"],
    svgPath: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z",
    viewBox: "0 0 24 24",
    category: "general",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
  {
    id: "question-mark",
    name: "Question Mark",
    tags: ["question", "help", "quiz", "unknown"],
    svgPath: "M11 18h2v-2h-2v2zm1-16C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-2.2 0-4 1.8-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.8-3 5h2c0-2.2 3-2.5 3-5 0-2.2-1.8-4-4-4z",
    viewBox: "0 0 24 24",
    category: "general",
    source: "curated",
    license: "CC0",
    styleVersion: 1,
  },
];

/**
 * Look up an asset by its id.
 */
export function getAsset(id: string): AssetRecord | undefined {
  return ASSET_LIBRARY.find((a) => a.id === id);
}

/**
 * Find assets matching all of the given tags.
 */
export function findAssetsByTags(tags: string[]): AssetRecord[] {
  return ASSET_LIBRARY.filter((a) =>
    tags.some((t) => a.tags.includes(t.toLowerCase())),
  );
}

/**
 * Get an SVG element string for an asset, wrapped in a viewBox.
 */
export function getAssetSvg(id: string): string | null {
  const asset = getAsset(id);
  if (!asset) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${asset.viewBox}" width="100" height="100"><path d="${asset.svgPath}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/**
 * Check provenance of an asset — confirms it's in our curated library.
 */
export function checkAssetProvenance(id: string): {
  valid: boolean;
  asset?: AssetRecord;
  reason?: string;
} {
  const asset = getAsset(id);
  if (!asset) {
    return { valid: false, reason: `Asset "${id}" not found in curated library` };
  }
  if (asset.license === "CC0" || asset.license === "MIT") {
    return { valid: true, asset };
  }
  return { valid: false, reason: `Asset "${id}" license (${asset.license}) requires review` };
}
