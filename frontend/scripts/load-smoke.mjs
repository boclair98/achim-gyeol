const baseUrl = process.argv[2] ?? process.env.LOAD_TEST_URL ?? "http://127.0.0.1:4173";
const total = Number(process.argv[3] ?? process.env.LOAD_TEST_REQUESTS ?? 100);
const concurrency = Number(process.argv[4] ?? process.env.LOAD_TEST_CONCURRENCY ?? 10);
const maxP95Ms = Number(process.env.LOAD_TEST_MAX_P95_MS ?? 10_000);
const durations = [];
let failures = 0;
let next = 0;

async function worker() {
  while (true) {
    const index = next++;
    if (index >= total) return;
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/?load=${index}`, { signal: AbortSignal.timeout(15_000), cache: "no-store" });
      if (!response.ok) failures += 1;
      await response.arrayBuffer();
    } catch {
      failures += 1;
    } finally {
      durations.push(performance.now() - started);
    }
  }
}

await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
durations.sort((a, b) => a - b);
const p95 = durations[Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1)] ?? Infinity;
const errorRate = total === 0 ? 1 : failures / total;
console.log(JSON.stringify({ baseUrl, total, concurrency, failures, errorRate, p95Ms: Math.round(p95) }, null, 2));
if (errorRate > 0.01 || p95 > maxP95Ms) process.exit(1);
