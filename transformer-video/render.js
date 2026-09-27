// Renders index.html frame-by-frame and encodes an MP4.
// Usage: NODE_PATH=$(npm root -g) node render.js [--stills 1,5,12]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30, DURATION = 30;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const dir = __dirname;
const framesDir = path.join(dir, 'frames');

(async () => {
  const stillsArg = process.argv.indexOf('--stills');
  const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(',').map(Number) : null;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(dir, 'index.html'));
  await page.evaluate(() => window.ready);
  const canvas = await page.$('canvas');

  if (stills) {
    for (const t of stills) {
      await page.evaluate(t => window.render(t), t);
      await canvas.screenshot({ path: path.join(dir, `still_${t}.png`) });
    }
    await browser.close();
    return;
  }

  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir);
  const total = FPS * DURATION;
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    await canvas.screenshot({ path: path.join(framesDir, String(f).padStart(4, '0') + '.png') });
    if (f % 90 === 0) console.log(`frame ${f}/${total}`);
  }
  await browser.close();

  execFileSync(FFMPEG, [
    '-y', '-framerate', String(FPS), '-i', path.join(framesDir, '%04d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', path.join(dir, 'transformer_30s.mp4'),
  ], { stdio: 'inherit' });
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log('done: transformer_30s.mp4');
})();
