// node svg2png.js <out_dir> <width> <svg...>  — transparent, high-resolution PNG of each SVG
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [out, W, ...files] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 800 } });
  for (const f of files) {
    const svg = fs.readFileSync(f, 'utf8');
    const m = svg.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/);
    const vw = +m[1], vh = +m[2], w = +W, h = Math.round(w * vh / vw);
    const pad = Math.round(w * 0.06);   // breathing room around the mark
    await p.setViewportSize({ width: w + 2 * pad, height: h + 2 * pad });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg style="position:absolute;left:${pad}px;top:${pad}px;width:${w}px;height:${h}px" `)}</body></html>`);
    await p.screenshot({ path: path.join(out, path.basename(f, '.svg') + '.png'), omitBackground: true });
  }
  await b.close();
})();
