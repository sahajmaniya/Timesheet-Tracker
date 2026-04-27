export function startApiTimer() {
  return performance.now();
}

export function finalizeApiTimer<T extends Response>(response: T, routeName: string, startedAt: number) {
  const durationMs = performance.now() - startedAt;
  response.headers.set("Server-Timing", `app;desc="${routeName}";dur=${durationMs.toFixed(2)}`);

  if (process.env.NODE_ENV !== "production" && process.env.PERF_API_LOGS === "true") {
    console.info(`[perf][api] ${routeName} ${Math.round(durationMs)}ms`);
  }

  return response;
}

