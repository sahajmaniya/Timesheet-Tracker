import { chromium } from '@playwright/test';

const pages = ['/', '/auth/signin', '/auth/signup', '/about', '/support', '/contact', '/student-assistant-timesheet-tracker', '/punch-in-punch-out-web-app', '/monthly-timesheet-csv-export', '/dashboard', '/settings'];
const viewports = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-14-pro-max', width: 430, height: 932 },
  { name: 'ipad', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const results = [];

for (const vp of viewports) {
  for (const path of pages) {
    const page = await context.newPage({ viewport: { width: vp.width, height: vp.height } });
    const url = `http://127.0.0.1:3000${path}`;
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      const status = response?.status() ?? 0;
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
        const clientW = doc.clientWidth;
        const overflowX = scrollW > clientW + 1;
        return { scrollW, clientW, overflowX };
      });
      results.push({ vp: vp.name, path, status, ...metrics });
    } catch (e) {
      results.push({ vp: vp.name, path, error: String(e) });
    } finally {
      await page.close();
    }
  }
}

await browser.close();
const bad = results.filter(r => r.error || r.status >= 400 || r.overflowX);
console.log(JSON.stringify({ total: results.length, badCount: bad.length, bad }, null, 2));
