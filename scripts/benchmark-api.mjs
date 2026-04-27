#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

const baseUrl = process.env.BENCH_BASE_URL ?? "http://127.0.0.1:3000";
const month = process.env.BENCH_MONTH ?? new Date().toISOString().slice(0, 7);
const sessionCookie = process.env.BENCH_SESSION_COOKIE ?? "";
const runs = Number(process.env.BENCH_RUNS ?? "8");
const pdfTemplatePath = process.env.BENCH_PDF_TEMPLATE_PATH ?? "";
const timesheetRole = process.env.BENCH_TIMESHEET_ROLE ?? "student_assistant";
const layoutMode = process.env.BENCH_LAYOUT_MODE ?? "auto";

const defaultHeaders = {
  ...(sessionCookie ? { Cookie: sessionCookie } : {}),
};

async function timedRequest(label, fn) {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const started = performance.now();
    const response = await fn();
    const elapsed = performance.now() - started;
    samples.push({ elapsed, status: response.status });
  }

  const elapsedValues = samples.map((item) => item.elapsed).sort((a, b) => a - b);
  const statusSummary = [...new Set(samples.map((item) => item.status))].join(",");
  const avg = elapsedValues.reduce((sum, value) => sum + value, 0) / elapsedValues.length;
  const p50 = elapsedValues[Math.floor(elapsedValues.length * 0.5)];
  const p95 = elapsedValues[Math.floor(elapsedValues.length * 0.95)] ?? elapsedValues[elapsedValues.length - 1];
  const max = elapsedValues[elapsedValues.length - 1];

  return {
    label,
    statusSummary,
    avgMs: avg,
    p50Ms: p50,
    p95Ms: p95,
    maxMs: max,
  };
}

function printRow(row) {
  const format = (n) => n.toFixed(1).padStart(8);
  console.log(
    `${row.label.padEnd(28)} statuses=${row.statusSummary.padEnd(8)} avg=${format(row.avgMs)}ms p50=${format(
      row.p50Ms,
    )}ms p95=${format(row.p95Ms)}ms max=${format(row.maxMs)}ms`,
  );
}

async function main() {
  console.log("API benchmark starting...");
  console.log(`baseUrl=${baseUrl}`);
  console.log(`month=${month}, runs=${runs}`);
  if (!sessionCookie) {
    console.log("warning: BENCH_SESSION_COOKIE missing (authenticated endpoints may return 401)");
  }

  const endpoints = [];

  endpoints.push(
    await timedRequest("GET /api/entries", () =>
      fetch(`${baseUrl}/api/entries?month=${encodeURIComponent(month)}`, {
        method: "GET",
        headers: defaultHeaders,
      }),
    ),
  );

  endpoints.push(
    await timedRequest("GET /api/entries/export", () =>
      fetch(`${baseUrl}/api/entries/export?month=${encodeURIComponent(month)}`, {
        method: "GET",
        headers: defaultHeaders,
      }),
    ),
  );

  if (pdfTemplatePath) {
    const absolutePdfPath = path.resolve(pdfTemplatePath);
    const bytes = await fs.readFile(absolutePdfPath);
    const fileName = path.basename(absolutePdfPath);

    endpoints.push(
      await timedRequest("POST /api/entries/fill-pdf", async () => {
        const formData = new FormData();
        formData.append("month", month);
        formData.append("timesheetRole", timesheetRole);
        formData.append("layoutMode", layoutMode);
        formData.append("file", new Blob([bytes], { type: "application/pdf" }), fileName);
        return fetch(`${baseUrl}/api/entries/fill-pdf`, {
          method: "POST",
          headers: defaultHeaders,
          body: formData,
        });
      }),
    );
  } else {
    console.log("info: BENCH_PDF_TEMPLATE_PATH not set, skipping /api/entries/fill-pdf benchmark");
  }

  console.log("\nBenchmark summary:");
  for (const row of endpoints) {
    printRow(row);
  }
}

main().catch((error) => {
  console.error("Benchmark failed:", error);
  process.exitCode = 1;
});
