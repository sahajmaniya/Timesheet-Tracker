import { describe, expect, it } from "vitest";
import { Matrix2DPolyfill } from "@/lib/dommatrix-polyfill";

describe("Matrix2DPolyfill", () => {
  it("chains scale and translate like DOMMatrix", () => {
    // pdfjs: new DOMMatrix().scaleSelf(1 / w, -1 / h).translateSelf(0, -h)
    const m = new Matrix2DPolyfill().scaleSelf(1 / 4, -1 / 2).translateSelf(0, -2);
    expect([m.a, m.b, m.c, m.d, m.e, m.f]).toEqual([0.25, 0, 0, -0.5, 0, 1]);
    expect(m.transformPoint({ x: 4, y: 0 })).toMatchObject({ x: 1, y: 1 });
  });

  it("builds from arrays and inverts", () => {
    const m = new Matrix2DPolyfill([2, 0, 0, 4, 10, 20]);
    const back = m.multiply(m.inverse());
    expect(back.isIdentity).toBe(true);
    expect(new Matrix2DPolyfill().scaleSelf(3).d).toBe(3);
  });
});
