import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/prismaClient.js';

async function runBenchmark() {
  console.log('=== STARTING BACKEND PERFORMANCE MEASUREMENT ===');

  // Warmup
  await request(app).get('/api/health');
  await request(app).get('/api/history?limit=1');

  const iterations = 25;

  async function benchmarkEndpoint(name, fn) {
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }
    times.sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const median = times[Math.floor(times.length / 2)];
    const mean = times.reduce((s, t) => s + t, 0) / times.length;
    const p95 = times[Math.floor(times.length * 0.95)];

    console.log(`\nEndpoint: ${name} (${iterations} iterations)`);
    console.log(`  Min:    ${min.toFixed(2)} ms`);
    console.log(`  Median: ${median.toFixed(2)} ms`);
    console.log(`  Mean:   ${mean.toFixed(2)} ms`);
    console.log(`  P95:    ${p95.toFixed(2)} ms`);
    console.log(`  Max:    ${max.toFixed(2)} ms`);
    return { min, median, mean, p95, max };
  }

  // 1. Health check
  const healthStats = await benchmarkEndpoint('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    if (res.status !== 200) throw new Error(`Health returned ${res.status}`);
  });

  // 2. URL analysis (heuristics + DB save)
  let lastUrlId = null;
  const urlStats = await benchmarkEndpoint('POST /api/analyze/url', async () => {
    const res = await request(app)
      .post('/api/analyze/url')
      .send({ url: 'https://paypal-security-verification.serveo.net/login?token=urgent' });
    if (res.status !== 200) throw new Error(`URL analyze returned ${res.status}`);
    lastUrlId = res.body.data.id;
  });

  // 3. Message analysis (heuristics + fallback + DB save)
  let lastMessageId = null;
  const messageStats = await benchmarkEndpoint('POST /api/analyze/message', async () => {
    const res = await request(app)
      .post('/api/analyze/message')
      .send({ message: 'URGENT: Your bank account will be suspended within 24 hours. Send OTP immediately to verify your identity.' });
    if (res.status !== 200) throw new Error(`Message analyze returned ${res.status}`);
    lastMessageId = res.body.data.id;
  });

  // 4. History pagination (page 1, limit 10)
  const historyStats = await benchmarkEndpoint('GET /api/history (limit=10)', async () => {
    const res = await request(app).get('/api/history?page=1&limit=10');
    if (res.status !== 200) throw new Error(`History returned ${res.status}`);
  });

  // 5. History record retrieval by ID
  const singleId = lastUrlId || lastMessageId;
  const historyByIdStats = await benchmarkEndpoint(`GET /api/history/${singleId}`, async () => {
    const res = await request(app).get(`/api/history/${singleId}`);
    if (res.status !== 200) throw new Error(`History by ID returned ${res.status}`);
  });

  console.log('\n=== MEASURING DATABASE QUERY COUNTS & TIMINGS ===');
  // Measure raw DB operations
  const t0 = performance.now();
  const count = await prisma.threatCheck.count();
  const t1 = performance.now();
  console.log(`Prisma count() on ThreatCheck: ${(t1 - t0).toFixed(2)} ms (Total rows: ${count})`);

  const t2 = performance.now();
  const historyPage = await prisma.threatCheck.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { safetyRecommendations: true },
  });
  const t3 = performance.now();
  console.log(`Prisma findMany(take: 10, include: safetyRecommendations): ${(t3 - t2).toFixed(2)} ms (Rows fetched: ${historyPage.length})`);

  const t4 = performance.now();
  const historyPageNoInclude = await prisma.threatCheck.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  const t5 = performance.now();
  console.log(`Prisma findMany(take: 10, WITHOUT include): ${(t5 - t4).toFixed(2)} ms`);

  await prisma.$disconnect();
  console.log('\n=== BENCHMARK COMPLETE ===');
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
