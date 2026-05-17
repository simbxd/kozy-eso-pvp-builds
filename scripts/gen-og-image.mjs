// Renders public/assets/og/og-template.html → public/assets/og/og-default.png
// Usage: node scripts/gen-og-image.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const htmlPath = resolve(root, 'public/assets/og/og-template.html');
const outPath = resolve(root, 'public/assets/og/og-default.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
// Ensure web fonts are fully loaded before snapshot
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

await page.screenshot({
  path: outPath,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});

await browser.close();
console.log('[gen-og] ✓ Written', outPath);
