// Usage: node render.js <html> <out.png> <w> <h>   |  node render.js --pdf <html> <out.pdf> <w> <h>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const args = process.argv.slice(2);
  const pdf = args[0] === '--pdf'; if (pdf) args.shift();
  const hq = args[0] === '--hq'; if (hq) args.shift();
  const [html, out, w, h] = args;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: hq ? 2 : 1 });
  await page.goto('file://' + path.resolve(html), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  if (pdf) await page.pdf({ path: out, width: w + 'px', height: h + 'px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  else await page.screenshot({ path: out, clip: { x: 0, y: 0, width: +w, height: +h } });
  // overflow check
  const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, content: [...document.querySelectorAll('.content,.page')].map(e=>e.scrollHeight-e.clientHeight) }));
  console.log(out, JSON.stringify(ov));
  await browser.close();
})();
