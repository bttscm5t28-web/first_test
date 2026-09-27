// Renders index.html frame-by-frame (in parallel pages) and encodes an MP4.
// Usage: NODE_PATH=$(npm root -g) FFMPEG=ffmpeg node render.js [--stills 5,30,60]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30, WORKERS = Number(process.env.WORKERS || 4);
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const OUT = 'vla_2min.mp4';
const dir = __dirname;
const framesDir = path.join(dir, 'frames');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(dir, 'index.html'));
  await page.evaluate(() => window.ready);
  return { page, canvas: await page.$('canvas') };
}

(async () => {
  const stillsArg = process.argv.indexOf('--stills');
  const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(',').map(Number) : null;
  const browser = await chromium.launch();

  if (stills) {
    const { page, canvas } = await openPage(browser);
    for (const t of stills) {
      await page.evaluate(t => window.render(t), t);
      await canvas.screenshot({ path: path.join(dir, `still_${t}.png`) });
    }
    await browser.close();
    return;
  }

  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir);
  const first = await openPage(browser);
  const total = FPS * await first.page.evaluate(() => window.DURATION);
  const pages = [first];
  for (let i = 1; i < WORKERS; i++) pages.push(await openPage(browser));
  let next = 0, done = 0;
  await Promise.all(pages.map(async ({ page, canvas }) => {
    while (next < total) {
      const f = next++;
      await page.evaluate(t => window.render(t), f / FPS);
      await canvas.screenshot({ path: path.join(framesDir, String(f).padStart(5, '0') + '.png') });
      if (++done % 300 === 0) console.log(`frame ${done}/${total}`);
    }
  }));
  await browser.close();

  execFileSync(FFMPEG, [
    '-y', '-v', 'warning', '-framerate', String(FPS), '-i', path.join(framesDir, '%05d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', path.join(dir, OUT),
  ], { stdio: 'inherit' });
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log('done: ' + OUT);
})();
