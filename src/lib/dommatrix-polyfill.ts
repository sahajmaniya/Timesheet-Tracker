type Matrix2D = { a: number; b: number; c: number; d: number; e: number; f: number };

/**
 * Minimal 2D DOMMatrix. pdfjs needs DOMMatrix while reading PDFs on the server;
 * locally it borrows one from the native @napi-rs/canvas add-on, but serverless
 * deployments (Vercel) don't ship that add-on, so reading crashed there.
 * Covers the 2D operations pdfjs uses; it is never used for rendering.
 */
class Matrix2DPolyfill implements Matrix2D {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: ArrayLike<number> | Matrix2D) {
    if (!init) return;
    if ("length" in init) {
      if (init.length >= 6) [this.a, this.b, this.c, this.d, this.e, this.f] = Array.from(init).slice(0, 6);
    } else {
      ({ a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f } = init);
    }
  }

  get is2D() {
    return true;
  }
  get isIdentity() {
    return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
  }
  get m11() {
    return this.a;
  }
  get m12() {
    return this.b;
  }
  get m21() {
    return this.c;
  }
  get m22() {
    return this.d;
  }
  get m41() {
    return this.e;
  }
  get m42() {
    return this.f;
  }

  multiplySelf(other: Matrix2D) {
    const { a, b, c, d, e, f } = this;
    this.a = a * other.a + c * other.b;
    this.b = b * other.a + d * other.b;
    this.c = a * other.c + c * other.d;
    this.d = b * other.c + d * other.d;
    this.e = a * other.e + c * other.f + e;
    this.f = b * other.e + d * other.f + f;
    return this;
  }
  preMultiplySelf(other: Matrix2D) {
    const result = new Matrix2DPolyfill(other).multiplySelf(this);
    Object.assign(this, { a: result.a, b: result.b, c: result.c, d: result.d, e: result.e, f: result.f });
    return this;
  }
  translateSelf(tx = 0, ty = 0) {
    return this.multiplySelf({ a: 1, b: 0, c: 0, d: 1, e: tx, f: ty });
  }
  scaleSelf(sx = 1, sy = sx) {
    return this.multiplySelf({ a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 });
  }
  invertSelf() {
    const { a, b, c, d, e, f } = this;
    const det = a * d - b * c;
    if (!det) {
      Object.assign(this, { a: NaN, b: NaN, c: NaN, d: NaN, e: NaN, f: NaN });
      return this;
    }
    Object.assign(this, {
      a: d / det,
      b: -b / det,
      c: -c / det,
      d: a / det,
      e: (c * f - d * e) / det,
      f: (b * e - a * f) / det,
    });
    return this;
  }
  multiply(other: Matrix2D) {
    return new Matrix2DPolyfill(this).multiplySelf(other);
  }
  translate(tx = 0, ty = 0) {
    return new Matrix2DPolyfill(this).translateSelf(tx, ty);
  }
  scale(sx = 1, sy = sx) {
    return new Matrix2DPolyfill(this).scaleSelf(sx, sy);
  }
  inverse() {
    return new Matrix2DPolyfill(this).invertSelf();
  }
  transformPoint(point: { x?: number; y?: number } = {}) {
    const x = point.x ?? 0;
    const y = point.y ?? 0;
    return { x: this.a * x + this.c * y + this.e, y: this.b * x + this.d * y + this.f, z: 0, w: 1 };
  }
}

/** Installs the 2D DOMMatrix stand-in when the runtime has none. */
export function ensureDomMatrix() {
  const scope = globalThis as { DOMMatrix?: unknown };
  if (typeof scope.DOMMatrix === "undefined") scope.DOMMatrix = Matrix2DPolyfill;
}

export { Matrix2DPolyfill };
