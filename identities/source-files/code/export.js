// node export.js <html> <png_dir|-> [pdf|-] [scale] [only-names-comma]
// Screenshots each <section data-name> to PNG and/or prints the whole document to PDF.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [html, dir, pdf, scale = '1', only] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: +scale });
  await p.goto('file://' + path.resolve(html), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  if (dir !== '-') {
    fs.mkdirSync(dir, { recursive: true });
    const want = only ? only.split(',') : null;
    for (const el of await p.$$('section[data-name]')) {
      const n = await el.getAttribute('data-name');
      if (want && !want.some(w => n.includes(w))) continue;
      await el.screenshot({ path: path.join(dir, n + '.png') });
    }
  }
  if (pdf && pdf !== '-') await p.pdf({ path: pdf, width: '1920px', height: '1080px', printBackground: true });
  await b.close();
})();
