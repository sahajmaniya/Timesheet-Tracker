export type TemplateAnchor = { text: string; x: number; y: number };

/**
 * Maps a point on the reference voucher to the uploaded template:
 * x' = sx·x + tx, y' = sy·y + ty.
 */
export type TemplateAlignment = {
  /** "aligned": labels found and consistent. "unreadable": no usable labels (scan, image-only PDF, other form). */
  status: "aligned" | "unreadable";
  sx: number;
  sy: number;
  tx: number;
  ty: number;
};

export const IDENTITY_ALIGNMENT: TemplateAlignment = { status: "aligned", sx: 1, sy: 1, tx: 0, ty: 0 };
const UNREADABLE: TemplateAlignment = { status: "unreadable", sx: 1, sy: 1, tx: 0, ty: 0 };

export type TemplateTextItem = { text: string; x: number; y: number; width: number };

/** Text printed on page 1 of a PDF (points, origin bottom-left); null if it can't be read. */
export async function readTemplateText(pdfBytes: Uint8Array): Promise<TemplateTextItem[] | null> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Run the parser in-process (no separate worker file), so it works in serverless bundles.
  const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  const globalScope = globalThis as { pdfjsWorker?: unknown };
  globalScope.pdfjsWorker ??= worker;

  const doc = await pdfjs.getDocument({ data: pdfBytes.slice(), verbosity: 0, isEvalSupported: false }).promise;
  try {
    const content = await (await doc.getPage(1)).getTextContent();
    return content.items.flatMap((item) =>
      "str" in item && item.str.trim()
        ? [{ text: item.str.trim(), x: item.transform[4], y: item.transform[5], width: item.width }]
        : [],
    );
  } finally {
    await doc.destroy();
  }
}

/** Least-squares fit of target = scale·source + offset; a single point gives a pure shift. */
function fitAxis(pairs: { source: number; target: number }[]) {
  const n = pairs.length;
  const meanSource = pairs.reduce((sum, p) => sum + p.source, 0) / n;
  const meanTarget = pairs.reduce((sum, p) => sum + p.target, 0) / n;
  const spread = pairs.reduce((sum, p) => sum + (p.source - meanSource) ** 2, 0);
  const scale = n < 2 || spread < 1 ? 1 : pairs.reduce((sum, p) => sum + (p.source - meanSource) * (p.target - meanTarget), 0) / spread;
  const offset = meanTarget - scale * meanSource;
  const worstMiss = Math.max(...pairs.map((p) => Math.abs(scale * p.source + offset - p.target)));
  return { scale, offset, worstMiss };
}

/**
 * Works out how an uploaded template's printed form is shifted and scaled
 * relative to the reference voucher, from where known labels landed. Exports of
 * the same spreadsheet differ by machine (margins, A4 vs Letter, fit-to-page).
 * Returns "unreadable" when the labels are missing or don't agree, so callers
 * can keep reference positions and warn the user.
 */
export async function detectTemplateAlignment(pdfBytes: Uint8Array, anchors: TemplateAnchor[]): Promise<TemplateAlignment> {
  try {
    return alignmentFromText(await readTemplateText(pdfBytes), anchors);
  } catch {
    return UNREADABLE;
  }
}

/** Same as detectTemplateAlignment, from text that was already read. */
export function alignmentFromText(items: TemplateTextItem[] | null, anchors: TemplateAnchor[]): TemplateAlignment {
  if (!items) return UNREADABLE;
  const matches = anchors.flatMap((anchor) => {
    const position = items.find((item) => item.text === anchor.text);
    return position ? [{ anchor, position }] : [];
  });
  if (matches.length === 0) return UNREADABLE;

  const x = fitAxis(matches.map((m) => ({ source: m.anchor.x, target: m.position.x })));
  const y = fitAxis(matches.map((m) => ({ source: m.anchor.y, target: m.position.y })));
  const plausibleScale = [x.scale, y.scale].every((scale) => scale >= 0.8 && scale <= 1.25);
  const plausibleShift = matches.length > 1 || (Math.abs(x.offset) <= 30 && Math.abs(y.offset) <= 30);
  const consistent = x.worstMiss <= 2 && y.worstMiss <= 2;
  if (!plausibleScale || !plausibleShift || !consistent) return UNREADABLE;

  return { status: "aligned", sx: x.scale, sy: y.scale, tx: x.offset, ty: y.offset };
}
