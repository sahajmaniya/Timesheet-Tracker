import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { detectTemplateAlignment } from "@/lib/pdf-anchors";

const anchors = [
  { text: "PAY PERIOD (MO./YR)", x: 71.78, y: 681.7 },
  { text: "TOTAL REGULAR HOURS WORKED:", x: 393.91, y: 233.69 },
  { text: "TOTAL HOURS WORKED:", x: 408.31, y: 94.22 },
];

/** A page with the labels placed as if the form were scaled by (sx, sy) and shifted by (tx, ty). */
async function templateWithLabels(t = { sx: 1, sy: 1, tx: 0, ty: 0 }, labels = anchors) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const label of labels) page.drawText(label.text, { x: t.sx * label.x + t.tx, y: t.sy * label.y + t.ty, size: 7, font });
  return doc.save();
}

describe("detectTemplateAlignment", () => {
  it("measures a shifted form (different export margins)", async () => {
    const a = await detectTemplateAlignment(await templateWithLabels({ sx: 1, sy: 1, tx: 0.5, ty: 2.3 }), anchors);
    expect(a.status).toBe("aligned");
    expect(a.sx).toBeCloseTo(1, 2);
    expect(a.tx).toBeCloseTo(0.5, 1);
    expect(a.ty).toBeCloseTo(2.3, 1);
  });

  it("measures a scaled form (A4, fit-to-page)", async () => {
    const a = await detectTemplateAlignment(await templateWithLabels({ sx: 0.97, sy: 1.04, tx: 4, ty: -12 }), anchors);
    expect(a.status).toBe("aligned");
    expect(a.sx).toBeCloseTo(0.97, 2);
    expect(a.sy).toBeCloseTo(1.04, 2);
    expect(a.tx).toBeCloseTo(4, 0);
    expect(a.ty).toBeCloseTo(-12, 0);
  });

  it("reports unreadable when labels are missing, inconsistent, or the file is not a PDF", async () => {
    expect((await detectTemplateAlignment(await templateWithLabels(undefined, []), anchors)).status).toBe("unreadable");
    const inconsistent = await templateWithLabels(undefined, [anchors[0], anchors[1], { ...anchors[2], y: anchors[2].y + 25 }]);
    expect((await detectTemplateAlignment(inconsistent, anchors)).status).toBe("unreadable");
    expect((await detectTemplateAlignment(new Uint8Array([1, 2, 3]), anchors)).status).toBe("unreadable");
  });
});
