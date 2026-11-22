// Visual QA of the Showroom site: Chromium + WebKit, 390 / 768 / 1440, EN + DE + FA, three pages.
// Console errors, failed requests, horizontal overflow, the controls; screenshots for review.
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium, webkit } from 'playwright';
const ROOT = process.cwd(), OUT = path.join(ROOT, 'out'), PORT = 8080;
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'picks'), { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  const size = fs.statSync(f).size, type = TYPES[path.extname(f)] || 'application/octet-stream', range = req.headers.range;
  if (range) { const m = /bytes=(\d*)-(\d*)/.exec(range); const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : size - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return fs.createReadStream(f, { start: a, end: b }).pipe(res); }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(res);
}).listen(PORT);
const URL0 = `http://localhost:${PORT}/`;
const VPS = [{ n: 390, w: 390, h: 844, mobile: true }, { n: 768, w: 768, h: 1024, mobile: true }, { n: 1440, w: 1440, h: 900 }];
const SECS = ['how', 'reel', 'brand', 'pricing', 'guide', 'faq', 'start'];
const PICK = new RegExp('^(' + [
  'chromium-390-(en|fa)-index-(hero|how|reel|brand|pricing|guide|faq|start|footer|switched)',
  'chromium-1440-(en|fa)-index-(hero|how|reel|brand|pricing|guide|faq|start|footer)',
  'chromium-390-de-index-(hero|pricing|brand)', 'chromium-768-de-index-(hero|how|pricing|reel)',
  'webkit-390-(en|fa)-index-(hero|reel|how)', 'webkit-1440-en-index-(hero|brand)',
  'chromium-(390|1440)-(en|fa)-app-(main|brand|credits|done)', 'chromium-768-de-app-(main|brand)', 'webkit-390-fa-app-main',
  'chromium-(390|1440)-(en|fa)-admin-(top|bottom|week)', 'chromium-768-de-admin-top',
  'reduced-.*'
].join('|') + ')$');
const report = { errors: [], overflow: [], controls: [], video: [], shots: 0 };
const FILTER = process.env.FILTER ? new RegExp(process.env.FILTER) : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function track(page, tag) {
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push({ tag, kind: 'console', text: m.text().slice(0, 300) }); });
  page.on('pageerror', (e) => report.errors.push({ tag, kind: 'pageerror', text: String(e).slice(0, 300) }));
  page.on('requestfailed', (r) => { const u = r.url(); if (/\.mp4$/.test(u)) return; report.errors.push({ tag, kind: 'requestfailed', text: u + ' ' + (r.failure()?.errorText || '') }); });
  page.on('response', (r) => { if (r.status() >= 400) report.errors.push({ tag, kind: 'http' + r.status(), text: r.url() }); });
}
async function shot(page, name) {
  const f = path.join(OUT, 'shots', name + '.jpg');
  await page.screenshot({ path: f, type: 'jpeg', quality: 62 });
  report.shots++;
  if (PICK.test(name)) fs.copyFileSync(f, path.join(OUT, 'picks', name + '.jpg'));
}
// an element counts as overflow only if it sticks out of the viewport and no clipping ancestor inside the viewport hides it
async function overflow(page, tag) {
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth, bad = [];
    const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.overflowX !== 'visible' || cs.clipPath !== 'none') { const b = p.getBoundingClientRect(); if (b.left >= -1.5 && b.right <= W + 1.5) return true; } } return false; };
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
      const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
      if ((b.right > W + 1.5 || b.left < -1.5) && !clipped(el)) bad.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''} [${Math.round(b.left)},${Math.round(b.right)}]`);
    }
    return { sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 10) };
  });
  if (r.sw > r.W + 1 || r.bad.length) report.overflow.push({ tag, ...r });
}
async function to(page, id) { await page.evaluate((s) => { const e = document.getElementById(s); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 64, behavior: 'instant' }); }, id); }
function ctl(tag, ok, info) { report.controls.push({ tag, ok, info }); if (!ok) report.errors.push({ tag, kind: 'controls', text: JSON.stringify(info).slice(0, 300) }); }

for (const [bn, bt] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await bt.launch();
  for (const vp of VPS) for (const lang of ['en', 'de', 'fa']) {
    const tag = `${bn}-${vp.n}-${lang}`;
    if (FILTER && !FILTER.test(tag)) continue;
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, isMobile: bn === 'chromium' && !!vp.mobile, hasTouch: !!vp.mobile, locale: { en: 'en-US', de: 'de-DE', fa: 'fa-IR' }[lang] });
    await ctx.addInitScript((l) => { try { localStorage.setItem('sr-lang', l); } catch (e) {} }, lang);
    const page = await ctx.newPage(); track(page, tag);
    // ---------- index ----------
    try {
      await page.goto(URL0 + 'index.html', { waitUntil: 'load' });
      await sleep(3200); await shot(page, `${tag}-index-hero`); await overflow(page, tag + '-index-hero');
      const dir = await page.evaluate(() => document.documentElement.dir);
      if ((lang === 'fa') !== (dir === 'rtl')) report.errors.push({ tag, kind: 'dir', text: dir });
      for (const id of SECS) { await to(page, id); await sleep(id === 'how' || id === 'reel' ? 2600 : 1500); await shot(page, `${tag}-index-${id}`); }
      await overflow(page, tag + '-index-sections');
      await to(page, 'reel'); await sleep(600);
      const v = await page.evaluate(() => { const v = document.getElementById('loopv'); return { src: v.currentSrc, t: Math.round(v.currentTime * 100) / 100, paused: v.paused, ready: v.readyState, err: v.error && v.error.code }; });
      report.video.push({ tag, ...v }); if (!v.src) report.errors.push({ tag, kind: 'video', text: JSON.stringify(v) });
      await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })); await sleep(900); await shot(page, `${tag}-index-footer`);
      if (vp.n !== 768) {
        await to(page, 'reel'); await page.locator('#ba').scrollIntoViewIfNeeded(); await sleep(2800);
        const box = await page.locator('#ba').boundingBox();
        await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.down();
        await page.mouse.move(box.x + box.width * .18, box.y + box.height * .5, { steps: 6 }); await page.mouse.up();
        const bx = await page.evaluate(() => window.SRI.ba());
        await page.focus('#baH'); await page.keyboard.press('End'); const kx = await page.evaluate(() => window.SRI.ba());
        ctl(tag + '-slider', bx < 30 && kx === 100, { bx, kx });
        await to(page, 'brand'); await sleep(1500); await page.click('.dealer[data-k="darya"]'); await sleep(1600);
        const br = await page.evaluate(() => ({ name: document.querySelector('#breel [data-d="name"]').textContent, acc: getComputedStyle(document.getElementById('breel')).getPropertyValue('--d-acc').trim(), dir: document.querySelector('#breel [data-d="hookbox"]').getAttribute('dir'), pressed: document.querySelector('.dealer[data-k="darya"]').getAttribute('aria-pressed') }));
        ctl(tag + '-brand', br.name === 'Autosalon Darya' && br.dir === 'rtl' && br.pressed === 'true', br);
        await shot(page, `${tag}-index-brand-darya`);
        await to(page, 'faq'); await sleep(800); await page.click('.faq details:first-child summary'); await sleep(900);
        const open = await page.evaluate(() => document.querySelector('.faq details').open);
        ctl(tag + '-faq', open, { open });
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(500);
        const other = lang === 'fa' ? 'en' : 'fa';
        await page.click(`.top .langs button[data-lang="${other}"]`); await sleep(1500);
        const sw = await page.evaluate(() => ({ dir: document.documentElement.dir, lang: document.documentElement.lang, h1: document.querySelector('h1').textContent.trim().slice(0, 30) }));
        ctl(tag + '-switch', sw.lang === other && (other === 'fa') === (sw.dir === 'rtl'), sw);
        await shot(page, `${tag}-index-switched`); await overflow(page, tag + '-index-switched');
        await page.click(`.top .langs button[data-lang="${lang}"]`); await sleep(300);
      }
    } catch (e) { report.errors.push({ tag, kind: 'test-index', text: String(e).slice(0, 400) }); }
    // ---------- app ----------
    try {
      await page.goto(URL0 + 'app.html', { waitUntil: 'load' });
      await sleep(2000); await shot(page, `${tag}-app-main`); await overflow(page, tag + '-app-main');
      if (vp.n < 1100) {
        await page.click('.tabs button[data-v="brand"]'); await sleep(800); await shot(page, `${tag}-app-brand`); await overflow(page, tag + '-app-brand');
        await page.click('.tabs button[data-v="credits"]'); await sleep(800); await shot(page, `${tag}-app-credits`); await overflow(page, tag + '-app-credits');
        await page.click('.tabs button[data-v="chat"]'); await sleep(600);
      }
      const n0 = await page.evaluate(() => window.SRA.count());
      await page.fill('#msg', 'Hello'); await page.press('#msg', 'Enter'); await sleep(1600);
      const n1 = await page.evaluate(() => window.SRA.count());
      await page.click('.rcard[data-v="2"] button[data-act="ok"]'); await sleep(1700);
      const cap = await page.evaluate(() => !!document.querySelector('.thread .cap'));
      ctl(tag + '-app', n1 === n0 + 2 && cap, { n0, n1, cap });
      await shot(page, `${tag}-app-done`); await overflow(page, tag + '-app-done');
    } catch (e) { report.errors.push({ tag, kind: 'test-app', text: String(e).slice(0, 400) }); }
    // ---------- admin ----------
    try {
      await page.goto(URL0 + 'admin.html', { waitUntil: 'load' });
      await sleep(2200); await shot(page, `${tag}-admin-top`); await overflow(page, tag + '-admin-top');
      await page.click('.seg button[data-r="week"]'); await sleep(1400);
      const k = await page.evaluate(() => window.SRD.kpi());
      await page.click('#aps .ap:first-child .acts button.go'); await sleep(900);
      const left = await page.evaluate(() => document.querySelectorAll('#aps .ap').length);
      ctl(tag + '-admin', (k === '71' || k === '۷۱') && left === 2, { k, left });
      await shot(page, `${tag}-admin-week`);
      await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })); await sleep(700);
      await shot(page, `${tag}-admin-bottom`); await overflow(page, tag + '-admin-bottom');
    } catch (e) { report.errors.push({ tag, kind: 'test-admin', text: String(e).slice(0, 400) }); }
    await ctx.close();
  }
  if (bn === 'chromium' && (!FILTER || FILTER.test('reduced'))) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); track(page, 'reduced');
    await page.goto(URL0 + 'index.html'); await sleep(1500); await shot(page, 'reduced-index-hero'); await overflow(page, 'reduced-index');
    await to(page, 'how'); await sleep(500); await shot(page, 'reduced-index-how');
    const vis = await page.evaluate(() => getComputedStyle(document.querySelector('.scene')).opacity);
    ctl('reduced-visible', vis === '1', { vis });
    await page.goto(URL0 + 'app.html'); await sleep(800); await shot(page, 'reduced-app');
    await ctx.close();
  }
  await browser.close();
}
server.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
console.log(`shots ${report.shots}, errors ${report.errors.length}, overflow ${report.overflow.length}, controls ok ${report.controls.filter((p) => p.ok).length}/${report.controls.length}`);
console.log(JSON.stringify({ errors: report.errors.slice(0, 40), overflow: report.overflow.slice(0, 20), video: report.video.slice(0, 6) }, null, 1));
process.exit(report.errors.length || report.overflow.length ? 1 : 0);
