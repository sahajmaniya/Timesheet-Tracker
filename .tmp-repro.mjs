import fs from "node:fs";
try {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  globalThis.pdfjsWorker ??= worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync("/Users/sahajmaniya/Documents/ISA/ISA Timsheet .pdf")), verbosity: 0, isEvalSupported: false }).promise;
  const items = (await (await doc.getPage(1)).getTextContent()).items;
  console.log("DOMMatrix available:", typeof globalThis.DOMMatrix, "| OK, items:", items.length);
} catch (e) { console.log("DOMMatrix available:", typeof globalThis.DOMMatrix, "| FAILED:", `${e.name}: ${e.message}`); }
