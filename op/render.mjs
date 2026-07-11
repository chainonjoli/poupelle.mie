// Renders frames from op.html. Usage:
//   node render.mjs samples 2 15 26 ...      -> sample_<t>.jpg
//   node render.mjs all <fps> <outdir>       -> frame_%05d.jpg
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const mode = process.argv[2] || 'samples';
const here = path.dirname(new URL(import.meta.url).pathname);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript(() => { window.__headless = true; });
await page.goto('file://' + path.join(here, 'op.html'));
await page.waitForFunction(() => typeof window.frameJPEG === 'function');
// make sure fonts are ready
await page.evaluate(() => document.fonts.load('92px "IPAMincho"').then(() => document.fonts.ready));

async function save(t, file, q = 0.92) {
  const dataUrl = await page.evaluate(([tt, qq]) => window.frameJPEG(tt, qq), [t, q]);
  fs.writeFileSync(file, Buffer.from(dataUrl.slice('data:image/jpeg;base64,'.length), 'base64'));
}

if (mode === 'samples') {
  const ts = process.argv.slice(3).map(Number);
  for (const t of ts) {
    await save(t, path.join(here, `sample_${String(t).replace('.', '_')}.jpg`));
    console.log('saved', t);
  }
} else if (mode === 'all') {
  const fps = Number(process.argv[3] || 24);
  const outdir = process.argv[4] || path.join(here, 'frames');
  fs.mkdirSync(outdir, { recursive: true });
  const total = Math.round(100 * fps);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await save(i / fps, path.join(outdir, `frame_${String(i).padStart(5, '0')}.jpg`), 0.9);
    if (i % 200 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${i}/${total} frames, ${el.toFixed(0)}s elapsed, eta ${(el / Math.max(i, 1) * (total - i)).toFixed(0)}s`);
    }
  }
  console.log('done', total, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
}
await browser.close();
