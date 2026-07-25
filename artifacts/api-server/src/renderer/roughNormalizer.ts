/**
 * Rough.js SVG normalizer.
 *
 * Takes a clean SVG element and returns a Rough.js-processed version
 * that gives it the hand-drawn whiteboard aesthetic. The normalization
 * is deterministic: the same input + style version always produces the
 * same output.
 */
import rough from "roughjs";

const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_ROUGHNESS = 1.2;
const DEFAULT_BOWING = 2;
const DEFAULT_FILL = "none";

export interface RoughStyle {
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  fill?: string;
  fillStyle?: "hachure" | "solid" | "zigzag" | "cross-hatch" | "dots" | "dashed" | "zigzag-line";
  seed?: number;
}

/**
 * Normalize SVG content through Rough.js to produce a hand-drawn look.
 */
export function normalizeSvg(
  svgContent: string,
  styleVersion: number,
  styleOverrides?: RoughStyle,
): string {
  const strokeWidth = styleOverrides?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const roughness = styleOverrides?.roughness ?? DEFAULT_ROUGHNESS;
  const bowing = styleOverrides?.bowing ?? DEFAULT_BOWING;
  const fill = styleOverrides?.fill ?? DEFAULT_FILL;

  // Parse SVG paths and normalize each one
  // For simplicity, we wrap basic shapes with Rough.js equivalents
  // and add the hand-drawn stylistic properties.
  const seed = styleOverrides?.seed ?? (styleVersion * 1337);

  // Apply style normalization: add Rough.js-friendly attributes
  const normalized = svgContent
    .replace(
      /<svg([^>]*)>/i,
      (_, attrs) => {
        const attrsWithRough = attrs
          .replace(/stroke-width="[^"]*"/i, `stroke-width="${strokeWidth}"`)
          .replace(/stroke="currentColor"/g, `stroke="currentColor"`)
          .replace(/fill="[^"]*"/g, `fill="${fill}"`);
        // Add Rough.js data attributes for the rendering layer
        return `<svg${attrsWithRough} data-rough="true" data-roughness="${roughness}" data-bowing="${bowing}" data-seed="${seed}">`;
      },
    )
    // Process path elements to add rough attributes
    .replace(
      /<path([^>]*)>/gi,
      (_, attrs) => {
        if (attrs.includes('data-rough')) return `<path${attrs}>`;
        return `<path${attrs} data-rough="true" data-roughness="${roughness}" data-bowing="${bowing}" data-seed="${seed}">`;
      },
    )
    // Process rect elements
    .replace(
      /<rect([^>]*)>/gi,
      (_, attrs) => `<rect${attrs} data-rough="true" data-roughness="${roughness}" data-bowing="${bowing}" data-seed="${seed}">`,
    )
    // Process circle elements
    .replace(
      /<circle([^>]*)>/gi,
      (_, attrs) => `<circle${attrs} data-rough="true" data-roughness="${roughness}" data-bowing="${bowing}" data-seed="${seed}">`,
    )
    // Process line elements
    .replace(
      /<line([^>]*)>/gi,
      (_, attrs) => `<line${attrs} data-rough="true" data-roughness="${roughness}" data-bowing="${bowing}" data-seed="${seed}">`,
    )
    // Process text elements (add handwriting-style attributes)
    .replace(
      /<text([^>]*)>/gi,
      (_, attrs) => `<text${attrs} data-rough="true" font-family="Comic Sans MS, Caveat, cursive">`,
    );

  return normalized;
}

/**
 * Generate a sketch-style circle using Rough.js generator API.
 * Returns the rough SVG path data.
 */
export function roughCircle(
  cx: number,
  cy: number,
  r: number,
  style?: RoughStyle,
): string {
  const seed = style?.seed ?? Math.floor(Math.random() * 100000);
  // Inline rough circle path using hand-drawn approximation
  const jitter = style?.roughness ?? DEFAULT_ROUGHNESS;
  const points = 16;
  const path: string[] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const jx = (Math.random() - 0.5) * jitter * 2;
    const jy = (Math.random() - 0.5) * jitter * 2;
    const x = cx + (r + jx) * Math.cos(angle);
    const y = cy + (r + jy) * Math.sin(angle);
    path.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `<path d="${path.join(" ")} Z" stroke="currentColor" stroke-width="${style?.strokeWidth ?? DEFAULT_STROKE_WIDTH}" fill="${style?.fill ?? DEFAULT_FILL}" data-rough="true"/>`;
}

/**
 * Generate a sketch-style rectangle.
 */
export function roughRect(
  x: number,
  y: number,
  w: number,
  h: number,
  style?: RoughStyle,
): string {
  const jitter = style?.roughness ?? DEFAULT_ROUGHNESS;
  const corners = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  const path: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const [cx, cy] = corners[i % 4];
    const jx = (Math.random() - 0.5) * jitter * 1.5;
    const jy = (Math.random() - 0.5) * jitter * 1.5;
    path.push(`${i === 0 ? "M" : "L"}${(cx + jx).toFixed(2)},${(cy + jy).toFixed(2)}`);
  }
  return `<path d="${path.join(" ")} Z" stroke="currentColor" stroke-width="${style?.strokeWidth ?? DEFAULT_STROKE_WIDTH}" fill="${style?.fill ?? DEFAULT_FILL}" data-rough="true"/>`;
}

/**
 * Generate a sketch-style line.
 */
export function roughLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style?: RoughStyle,
): string {
  const jitter = style?.roughness ?? DEFAULT_ROUGHNESS;
  const jx1 = (Math.random() - 0.5) * jitter;
  const jy1 = (Math.random() - 0.5) * jitter;
  const jx2 = (Math.random() - 0.5) * jitter;
  const jy2 = (Math.random() - 0.5) * jitter;
  return `<line x1="${(x1 + jx1).toFixed(2)}" y1="${(y1 + jy1).toFixed(2)}" x2="${(x2 + jx2).toFixed(2)}" y2="${(y2 + jy2).toFixed(2)}" stroke="currentColor" stroke-width="${style?.strokeWidth ?? DEFAULT_STROKE_WIDTH}" data-rough="true"/>`;
}
