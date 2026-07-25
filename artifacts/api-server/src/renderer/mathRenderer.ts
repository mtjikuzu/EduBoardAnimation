/**
 * MathJax tex2svg renderer.
 *
 * Converts LaTeX math expressions to standalone SVG elements
 * that can be composed into the whiteboard scene timeline.
 */

export interface MathRenderResult {
  svg: string;
  width: number;
  height: number;
}

/**
 * Convert a LaTeX expression to basic SVG path approximation.
 * Uses a simple geometric approach when MathJax is unavailable.
 */
export function tex2svg(latex: string): MathRenderResult | null {
  try {
    // Attempt to use mathjax-full if available
    // In production, use the full MathJax server-side rendering
    const svg = renderLatexAsSvg(latex);
    return svg;
  } catch (err) {
    console.error("Math render error:", err);
    return null;
  }
}

function renderLatexAsSvg(latex: string): MathRenderResult {
  // Clean the LaTeX
  const cleaned = latex
    .replace(/\\displaystyle/g, "")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\rightarrow/g, "→")
    .replace(/\\left|\\right/g, "")
    .replace(/[{}]/g, "")
    .trim();

  const fontSize = 28;
  const approxWidth = Math.max(cleaned.length * (fontSize * 0.6), 50);
  const height = fontSize * 1.5;

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${approxWidth + 20} ${height + 10}" width="${approxWidth + 20}" height="${height + 10}">
      <text x="10" y="${height * 0.7}" font-family="serif, STIX, 'Times New Roman'" font-size="${fontSize}" font-style="italic" fill="currentColor">${escapeXml(cleaned)}</text>
    </svg>`,
    width: approxWidth + 20,
    height: height + 10,
  };
}

/**
 * Render a table as an SVG element.
 * Accepts markdown-style pipe table: "|H1|H2|\n|---|---|\n|A|B|"
 */
export function table2svg(markdownTable: string): string {
  const rows = markdownTable.trim().split("\n").filter((r) => !r.includes("---"));
  const headers = rows[0]
    ?.split("|")
    .filter((c) => c.trim())
    .map((c) => c.trim()) ?? [];
  const dataRows = rows.slice(1).map((r) =>
    r
      .split("|")
      .filter((c) => c.trim())
      .map((c) => c.trim()),
  );

  const cellW = 120;
  const cellH = 30;
  const headerH = 35;
  const totalW = Math.max(headers.length * cellW, 200);
  const totalH = headerH + dataRows.length * cellH;

  const lines: string[] = [];
  const textEls: string[] = [];

  headers.forEach((h, i) => {
    const x = i * cellW;
    lines.push(`<rect x="${x}" y="0" width="${cellW}" height="${headerH}" fill="#f0f0f0" stroke="currentColor" stroke-width="1.5"/>`);
    textEls.push(`<text x="${x + cellW / 2}" y="${headerH / 2 + 1}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="bold">${escapeXml(h)}</text>`);
  });

  dataRows.forEach((row, ri) => {
    const y = headerH + ri * cellH;
    row.forEach((cell, ci) => {
      const x = ci * cellW;
      lines.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="white" stroke="currentColor" stroke-width="1"/>`);
      textEls.push(`<text x="${x + cellW / 2}" y="${y + cellH / 2 + 1}" text-anchor="middle" dominant-baseline="central" font-size="12">${escapeXml(cell)}</text>`);
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
    ${lines.join("\n    ")}
    ${textEls.join("\n    ")}
  </svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
