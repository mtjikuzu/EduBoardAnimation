/**
 * SVG timeline compiler.
 *
 * Takes a storyboard scene's elements and compiles them into
 * an animated SVG/HTML timeline with draw-order, path-dash animation,
 * camera transforms, and narration-timed captions.
 */
import { getAssetSvg } from "./assetRegistry";
import { normalizeSvg, roughRect, roughCircle, roughLine } from "./roughNormalizer";
import { tex2svg, table2svg } from "./mathRenderer";

export interface TimelineScene {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  elements: TimelineElement[];
  narration?: string;
  captions?: string[];
}

export interface TimelineElement {
  type: string;
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  drawOrder: number;
  timingHint?: string;
  styleOverrides?: Record<string, string>;
}

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const FPS = 30;

/**
 * Compile a scene into an SVG/HTML page that can be rendered
 * by headless Chromium frame-by-frame.
 */
export function compileScene(
  elements: TimelineElement[],
  narration?: string,
  durationSec: number = 60,
  globalStyle?: { strokeWidth?: number; roughness?: number; palette?: string[] },
): string {
  const sortedElements = [...elements].sort((a, b) =>
    (a.drawOrder ?? 0) - (b.drawOrder ?? 0),
  );

  const totalFrames = Math.round(durationSec * FPS);
  const palette = globalStyle?.palette ?? ["#1a1a2e", "#16213e", "#0f3460", "#e94560"];

  const styleOverrides = {
    strokeWidth: globalStyle?.strokeWidth ?? 2,
    roughness: globalStyle?.roughness ?? 1.2,
  };

  // Build SVG elements
  const svgElements: string[] = [];
  let order = 0;

  for (const el of sortedElements) {
    const visibleAtFrame = el.timingHint
      ? parseTimingHint(el.timingHint, totalFrames)
      : Math.round((order / sortedElements.length) * totalFrames * 0.3);

    const elementSvg = renderElement(el, styleOverrides, palette);
    if (elementSvg) {
      // Wrap with draw animation (stroke-dashoffset)
      const animDuration = Math.max(15, Math.round(totalFrames * 0.15));
      const animatedSvg = elementSvg.replace(
        /<path([^>]*)>/gi,
        (_, attrs) => {
          if (attrs.includes('stroke-dasharray')) return `<path${attrs}>`;
          return `<path${attrs} stroke-dasharray="2000" stroke-dashoffset="2000">
            <animate attributeName="stroke-dashoffset" from="2000" to="0"
              dur="${animDuration / FPS}s" begin="${visibleAtFrame / FPS}s" fill="freeze"/>
          </path>`;
        },
      );
      svgElements.push(animatedSvg);
    }
    order++;
  }

  // Add narration caption overlay
  const captionHtml = narration
    ? `<div id="caption" style="position:absolute;bottom:60px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.7);color:white;padding:12px 24px;border-radius:8px;
        font-family:sans-serif;font-size:24px;text-align:center;max-width:80%;
        opacity:0;transition:opacity 0.3s;">
        <span id="caption-text">${escapeHtml(narration)}</span>
      </div>
      <script>
        // Fade in caption after first frame
        setTimeout(() => {
          document.getElementById('caption').style.opacity = '1';
        }, 500);
      </script>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #faf8f5; width: ${CANVAS_W}px; height: ${CANVAS_H}px; overflow: hidden; }
  #scene { width: ${CANVAS_W}px; height: ${CANVAS_H}px; position: relative; }
  svg { width: ${CANVAS_W}px; height: ${CANVAS_H}px; }
</style>
</head>
<body>
  <div id="scene">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
      <!-- Background -->
      <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#faf8f5"/>
      ${svgElements.join("\n      ")}
    </svg>
    ${captionHtml}
  </div>
</body>
</html>`;
}

function renderElement(
  el: TimelineElement,
  style: { strokeWidth: number; roughness: number },
  palette: string[],
): string | null {
  const x = el.x ?? 0;
  const y = el.y ?? 0;
  const w = el.width ?? 100;
  const h = el.height ?? 100;
  const color = palette[(el.drawOrder ?? 0) % palette.length];

  switch (el.type) {
    case "text":
      return `<text x="${x}" y="${y + 20}" font-family="Comic Sans MS, Caveat, cursive" font-size="32" fill="${color}">${escapeHtml(el.content)}</text>`;

    case "icon":
    case "shape": {
      const assetSvg = getAssetSvg(el.content);
      if (assetSvg) {
        return assetSvg.replace(
          "<svg",
          `<svg x="${x}" y="${y}" width="${w}" height="${h}"`,
        );
      }
      // Fallback: draw a rough shape
      if (el.content === "circle") return roughCircle(x + w / 2, y + h / 2, Math.min(w, h) / 2, style);
      return roughRect(x, y, w, h, style);
    }

    case "math": {
      const mathResult = tex2svg(el.content);
      if (mathResult) {
        return mathResult.svg.replace(
          "<svg",
          `<svg x="${x}" y="${y}" width="${mathResult.width}" height="${mathResult.height}"`,
        );
      }
      // Fallback: show raw LaTeX
      return `<text x="${x}" y="${y + 20}" font-family="monospace" font-size="24" fill="${color}">${escapeHtml(el.content)}</text>`;
    }

    case "table": {
      return table2svg(el.content).replace(
        "<svg",
        `<svg x="${x}" y="${y}"`,
      );
    }

    case "handPointer":
      return `<path d="M12 2C10.3 2 9 4 9 6s1.3 4 3 4 3-1.8 3-4-1.3-4-3-4z" fill="${color}" x="${x}" y="${y}"/>`;

    default:
      return null;
  }
}

function parseTimingHint(hint: string, totalFrames: number): number {
  // Support "after:N" or "at:N%" or "delay:N" formats
  const after = hint.match(/after:(\d+)/)?.[1];
  if (after) return parseInt(after, 10) * FPS;

  const pct = hint.match(/(\d+)%/)?.[1];
  if (pct) return Math.round((parseInt(pct, 10) / 100) * totalFrames);

  const delay = hint.match(/delay:(\d+)/)?.[1];
  if (delay) return parseInt(delay, 10);

  return 0;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
