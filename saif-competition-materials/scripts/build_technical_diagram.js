const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

// ============================================================
// Palette (print-friendly: works in B/W too, color is a bonus cue only)
// ============================================================
const INK = "#101820";       // near-black main line/text
const GRAY = "#5A6472";      // secondary text
const LINE = "#B9C0CB";      // light borders
const FRAME_BG = "#F4F6F9";  // backend frame tint
const BOX_BG = "#FFFFFF";
const ACCENT = "#0F6E6B";    // petrol accent (headers, component numbers)
const TRIGGER = "#B65C1F";   // recompute-trigger arrow color (amber/brown, distinct in B/W by shape too)
const ALERT = "#B0392B";     // alert/deadline color

const PAGE_W = 297;
let PAGE_H = 620; // mm, generous during layout; trimmed to final content height before export
const MX = 15; // side margin mm
const CW = PAGE_W - MX * 2; // content width mm

let defs = [];
let els = [];

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

function rect(x, y, w, h, opts = {}) {
  const {
    fill = BOX_BG, stroke = INK, sw = 0.5, rx = 2.2, dash = null
  } = opts;
  els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`);
}

function diamond(cx, cy, w, h, opts = {}) {
  const { fill = BOX_BG, stroke = INK, sw = 0.5 } = opts;
  const pts = `${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`;
  els.push(`<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);
}

// text lines: array of {t, size, weight, color, dy_extra}
function textBlock(cx, topY, lines, opts = {}) {
  const { align = "middle", lineGap = 1.15, anchorX = null } = opts;
  const x = anchorX !== null ? anchorX : cx;
  let y = topY;
  const parts = [];
  lines.forEach((ln) => {
    const size = ln.size || 3.2;
    y += size * lineGap;
    parts.push(`<text x="${x}" y="${y.toFixed(2)}" font-size="${size}" font-weight="${ln.weight || 400}" fill="${ln.color || INK}" text-anchor="${align}" font-family="${ln.mono ? "'Courier New',monospace" : "'Noto Kufi Arabic','Arial',sans-serif"}" direction="rtl">${esc(ln.t)}</text>`);
  });
  els.push(parts.join(""));
  return y; // bottom of text block
}

// A component box with title/subtitle/desc lines, vertically centered content
function compBox(x, y, w, h, num, title, sub, desc, opts = {}) {
  rect(x, y, w, h, opts);
  const lines = [];
  lines.push({ t: `(${num}) ${title}`, size: opts.titleSize || 3.5, weight: 700, color: INK });
  if (sub) lines.push({ t: sub, size: 2.75, weight: 400, color: ACCENT, mono: true });
  (desc || []).forEach(d => lines.push({ t: d, size: 2.7, weight: 400, color: GRAY }));
  const totalLines = lines.length;
  const lineGap = 1.25;
  const blockH = lines.reduce((s, l) => s + l.size * lineGap, 0);
  const topY = y + (h - blockH) / 2 - (lines[0].size * 0.15);
  textBlock(x + w / 2, topY, lines, { align: "middle", lineGap });
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, num };
}

// ---- markers ----
defs.push(`
  <marker id="arrowData" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L6,3 L0,6 Z" fill="${INK}"/>
  </marker>
  <marker id="arrowTrigger" markerWidth="9" markerHeight="9" refX="6.5" refY="3.5" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L7,3.5 L0,7" fill="none" stroke="${TRIGGER}" stroke-width="1.1"/>
  </marker>
  <marker id="arrowAlert" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L6,3 L0,6 Z" fill="${ALERT}"/>
  </marker>
`);

// orthogonal elbow path helper: from point A to point B via one bend
function elbow(x1, y1, x2, y2, mode = "auto") {
  // mode: "h-first" (go horizontal then vertical) or "v-first"
  if (mode === "h-first") return `M${x1},${y1} L${x2},${y1} L${x2},${y2}`;
  if (mode === "v-first") return `M${x1},${y1} L${x1},${y2} L${x2},${y2}`;
  return `M${x1},${y1} L${x2},${y2}`;
}

function arrow(pathD, opts = {}) {
  const { color = INK, sw = 0.6, dash = null, marker = "arrowData" } = opts;
  els.push(`<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""} marker-end="url(#${marker})"/>`);
}

function arrowLabel(x, y, text, opts = {}) {
  const { size = 2.55, color = INK, bg = true, align = "middle" } = opts;
  if (bg) {
    const w = text.length * size * 0.62 + 2.4;
    els.push(`<rect x="${(x - w / 2).toFixed(2)}" y="${(y - size * 1.05).toFixed(2)}" width="${w.toFixed(2)}" height="${(size * 1.5).toFixed(2)}" fill="#FFFFFF" opacity="0.92"/>`);
  }
  els.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${align}" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">${esc(text)}</text>`);
}

function sectionLabel(x, y, num, title, opts = {}) {
  els.push(`<text x="${x}" y="${y}" font-size="${opts.size || 6.4}" font-weight="700" fill="${INK}" text-anchor="${opts.align || "start"}" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">الشكل (${num}): ${esc(title)}</text>`);
}

function note(x, y, w, h, lines, opts = {}) {
  rect(x, y, w, h, { fill: opts.fill || "#FDF3EC", stroke: opts.stroke || TRIGGER, sw: 0.5, rx: 1.8, dash: opts.dash });
  const arr = lines.map(t => ({ t, size: opts.size || 2.6, weight: opts.weight || 400, color: opts.color || INK }));
  textBlock(x + w / 2, y + 1.5, arr, { align: "middle", lineGap: 1.25 });
}

/* =========================================================================================
   TITLE + SHARED LEGEND
   ========================================================================================= */
let y = 16;
els.push(`<text x="${PAGE_W / 2}" y="${y + 6}" font-size="8.2" font-weight="800" fill="${INK}" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">التصميم التقني المقترح لنظام أثر</text>`);
y += 16;

// Legend box (two rows, generous computed spacing so labels never collide)
const legY = y, legH = 26;
rect(MX, legY, CW, legH, { fill: "#FBFCFD", stroke: LINE, sw: 0.4, rx: 1.6 });
els.push(`<text x="${MX + CW - 3}" y="${legY + 5}" font-size="3.4" font-weight="700" fill="${INK}" text-anchor="start" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">مفتاح الرموز</text>`);

// generic legend chip: draws a small icon then label to its LEFT (RTL), returns slot width consumed
function legendChip(rightX, cy, iconDraw, label, size = 2.7) {
  const iconW = 15; // reserved width for the icon/marker itself
  const textW = label.length * size * 0.95 + 4; // per-char estimate + padding (tuned after visual QA)
  iconDraw(rightX - iconW, rightX, cy);
  els.push(`<text x="${(rightX - iconW - 3).toFixed(2)}" y="${(cy + 1.1).toFixed(2)}" font-size="${size}" fill="${INK}" text-anchor="start" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">${esc(label)}</text>`);
  return iconW + textW + 10; // total slot width including trailing gap
}

const legRow1Y = legY + 11, legRow2Y = legY + 20.5;
let clx = MX + CW - 4;
clx -= legendChip(clx, legRow1Y, (x1, x2, cy) => {
  els.push(`<line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}" stroke="${INK}" stroke-width="0.7"/>`);
}, "قياس / مسار مسجَّل");
clx -= legendChip(clx, legRow1Y, (x1, x2, cy) => {
  els.push(`<line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}" stroke="${INK}" stroke-width="0.7" stroke-dasharray="2,1.4"/>`);
}, "منطقة / موقع تقديري");
clx -= legendChip(clx, legRow1Y, (x1, x2, cy) => {
  els.push(`<line x1="${x1}" y1="${cy}" x2="${x2 - 1.5}" y2="${cy}" stroke="${INK}" stroke-width="0.6" marker-end="url(#arrowData)"/>`);
}, "سهم نقل بيانات");
clx -= legendChip(clx, legRow1Y, (x1, x2, cy) => {
  els.push(`<line x1="${x1}" y1="${cy}" x2="${x2 - 1.5}" y2="${cy}" stroke="${TRIGGER}" stroke-width="0.7" marker-end="url(#arrowTrigger)"/>`);
}, "سهم تشغيل إعادة حساب");

let clx2 = MX + CW - 4;
clx2 -= legendChip(clx2, legRow2Y, (x1, x2, cy) => {
  els.push(`<rect x="${x1 + 3}" y="${cy - 2.6}" width="9" height="5.2" rx="0.6" fill="${BOX_BG}" stroke="${INK}" stroke-width="0.5"/>`);
}, "مربّع = وحدة برمجية");
clx2 -= legendChip(clx2, legRow2Y, (x1, x2, cy) => {
  const c = x1 + 7.5;
  els.push(`<polygon points="${c},${cy - 3.2} ${c + 4.5},${cy} ${c},${cy + 3.2} ${c - 4.5},${cy}" fill="${BOX_BG}" stroke="${INK}" stroke-width="0.5"/>`);
}, "معيَّن = نقطة قرار");
clx2 -= legendChip(clx2, legRow2Y, (x1, x2, cy) => {
  els.push(`<rect x="${x1 + 3}" y="${cy - 2.6}" width="9" height="5.2" rx="0.6" fill="${FRAME_BG}" stroke="${INK}" stroke-width="0.5"/>`);
}, "إطار مظلَّل = خدمات مستضافة");

y = legY + legH + 6;

/* =========================================================================================
   FIGURE 1 — بنية النظام وتدفق البيانات
   ========================================================================================= */
const fig1Top = y;
sectionLabel(MX + CW, fig1Top + 5, 1, "بنية النظام وتدفق البيانات", { align: "start", size: 5.6 });
let f1y = fig1Top + 10;

// client boxes (outside backend frame)
const clientH = 20;
const clientTop = f1y;
const clientBottom = f1y + clientH;
const B101 = compBox(MX + CW - 80, f1y, 80, clientH, 101, "تطبيق المسافر", "Flutter",
  ["تسجيل خطة الرحلة وموعد الاطمئنان", "وحفظ محلي حتى تأكيد الاستلام"]);
const B108 = compBox(MX, f1y, 80, clientH, 108, "واجهة المتابعة", "TypeScript · MapLibre GL JS",
  ["بطاقة الرحلة والمناطق التقديرية", "وأسباب ترتيبها وآخر تحديث"]);

f1y += clientH + 5;

// backend frame
const frameTop = f1y;
const rowH1 = 22, rowH2 = 20, rowH3 = 22, rowH4 = 20, gap = 5, padTop = 10, padBot = 7, padX = 8;
const frameH = padTop + rowH1 + gap + rowH2 + gap + rowH3 + gap + rowH4 + padBot;
rect(MX, frameTop, CW, frameH, { fill: FRAME_BG, stroke: INK, sw: 0.6, rx: 2.5 });
els.push(`<text x="${MX + CW / 2}" y="${frameTop + 6.5}" font-size="3.6" font-weight="700" fill="${INK}" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">خدمات النظام على استضافة جاهزة (استضافة سحابية اعتيادية)</text>`);

const ix1 = MX + padX, ix2 = MX + CW - padX; // interior x bounds
const halfW = (ix2 - ix1 - gap) / 2;

let ry = frameTop + padTop;
const B102 = compBox(ix1 + halfW + gap, ry, halfW, rowH1, 102, "استقبال البيانات والتحقق", "Python · FastAPI",
  ["تحقق الحقول وختم وقت الوصول،", "ومنع تكرار القياس بمعرّف فريد"]);
const B107 = compBox(ix1, ry, halfW, rowH1, 107, "مراقبة موعد الاطمئنان", null,
  ["خدمة خلفية دورية — تنشئ تنبيهًا", "عند تجاوز المهلة دون تأكيد سلامة"]);

ry += rowH1 + gap;
const B103 = compBox(ix1, ry, ix2 - ix1, rowH2, 103, "قاعدة البيانات المكانية والزمنية", "PostgreSQL · PostGIS",
  ["الرحلات، القياسات، المشاهدات، نقاط الاستعادة الحسابية، وإصدارات خرائط البحث"]);

ry += rowH2 + gap;
const B104 = compBox(ix1 + halfW + gap, ry, halfW, rowH3, 104, "محرك التحليل المكاني والاحتمالي", "Python · NumPy",
  ["H3 · NetworkX · Dijkstra", "استدلال بايزي متتابع لتحديث الأوزان"]);
const B105 = compBox(ix1, ry, halfW, rowH3, 105, "معالجة الأدلة المتأخرة", null,
  ["ترتيب الأدلة زمنيًا، واسترجاع الحالة", "السابقة المناسبة، ثم إعادة الحساب"]);

ry += rowH3 + gap;
const B106 = compBox(ix1, ry, ix2 - ix1, rowH4, 106, "ترتيب مناطق البحث", null,
  ["تجميع أوزان الحالات داخل المناطق وربطها بزمن الوصول والتفتيش لتكوين ترتيب أولي قابل للمراجعة"]);

const frameBottom = frameTop + frameH;

// ---- arrows ----
// 101 -> 102 : دفعة قياسات
{
  const midY = (B101.y + B101.h + B102.y) / 2;
  arrow(`M${B101.cx},${B101.y + B101.h} L${B101.cx},${midY} L${B102.cx},${midY} L${B102.cx},${B102.y}`, {});
  arrowLabel((B101.cx + B102.cx) / 2, midY - 1.2, "دفعة قياسات");
}

// 102 -> 103 : أدلة مقبولة
arrow(`M${B102.cx},${B102.y + B102.h} L${B102.cx},${B103.y}`, {});
arrowLabel(B102.cx + 20, (B102.y + B102.h + B103.y) / 2, "أدلة مقبولة");

// 103 -> 104 : بيانات القياسات
arrow(`M${B104.cx},${B103.y + B103.h} L${B104.cx},${B104.y}`, {});
arrowLabel(B104.cx - 18, (B103.y + B103.h + B104.y) / 2, "بيانات مخزَّنة");

// 105 <-> 103 : استرجاع حالة سابقة (data, dashed-free, style data)
arrow(`M${B105.cx},${B105.y} L${B105.cx},${B103.y + B103.h}`, {});
arrowLabel(B105.cx - 20, (B103.y + B103.h + B105.y) / 2, "استرجاع حالة سابقة");

// 105 -> 104 : إعادة حساب (TRIGGER style, distinct)
arrow(`M${B105.x + B105.w},${B105.cy} L${B104.x},${B104.cy}`, { color: TRIGGER, sw: 0.8, marker: "arrowTrigger" });
arrowLabel((B105.x + B105.w + B104.x) / 2, B105.cy - 2, "إعادة حساب", { color: TRIGGER });

// 104 -> 106 : أوزان محدّثة
arrow(`M${B104.cx},${B104.y + B104.h} L${B104.cx},${B106.y}`, {});
arrowLabel(B104.cx - 18, (B104.y + B104.h + B106.y) / 2, "أوزان محدّثة");

// 106 -> 103 : إصدار جديد (feed back up to DB) — route around the right side
{
  const rx = ix2 + 4;
  arrow(`M${B106.x + B106.w - 6},${B106.y} L${B106.x + B106.w - 6},${(B106.y + frameTop) / 2 - 2} L${rx},${(B106.y + frameTop) / 2 - 2} L${rx},${B103.cy} L${B103.x + B103.w},${B103.cy}`, {});
  arrowLabel(rx + 2, (B106.y + B103.cy) / 2, "إصدار جديد", { align: "start" });
}

// 106 -> 108 : مناطق مرتبة (exits frame to the left client box)
{
  const lx2 = ix1 - 4;
  arrow(`M${B106.x + 6},${B106.y} L${B106.x + 6},${frameTop + frameH / 2} L${lx2},${frameTop + frameH / 2} L${lx2},${B108.cy} L${B108.x},${B108.cy}`, {});
  arrowLabel(lx2 - 2, frameTop + frameH / 2 - 2, "مناطق مرتبة", { align: "start" });
}

// 107 -> 103 : فحص الموعد (read)
arrow(`M${B107.cx},${B107.y + B107.h} L${B107.cx},${B103.y}`, { sw: 0.45 });
arrowLabel(B107.cx + 16, (B107.y + B107.h + B103.y) / 2, "فحص دوري", { size: 2.4 });

// 107 -> 108 : تنبيه تأخر (ALERT) — routed through the gap between the client row and the frame
{
  const gapY = (clientBottom + frameTop) / 2;
  arrow(`M${B107.cx},${B107.y} L${B107.cx},${gapY} L${B108.cx - 8},${gapY} L${B108.cx - 8},${clientBottom}`, { color: ALERT, marker: "arrowAlert", sw: 0.75 });
  arrowLabel(B108.cx - 8, gapY - 1.4, "تنبيه تأخر", { color: ALERT });
}

// 108 -> 102 : مشاهدة جديدة / تسجيل تفتيش (feedback loop, through the same gap)
{
  const gapY2 = (clientBottom + frameTop) / 2 + 1.6;
  arrow(`M${B108.cx + 12},${clientBottom} L${B108.cx + 12},${gapY2} L${B102.cx},${gapY2} L${B102.cx},${B102.y}`, { sw: 0.5, dash: "1.4,1.2" });
  arrowLabel((B108.cx + 12 + B102.cx) / 2, gapY2 + 2.6, "مشاهدة جديدة / تسجيل تفتيش", { size: 2.2 });
}

const fig1Bottom = frameBottom;
y = fig1Bottom + 10;

/* =========================================================================================
   FIGURE 2 — آلية المعالجة خطوة بخطوة
   ========================================================================================= */
const fig2Top = y;
sectionLabel(MX + CW, fig2Top + 5, 2, "آلية المعالجة خطوة بخطوة", { align: "start", size: 5.6 });
let f2y = fig2Top + 10;

const mainW = 172, mainX = MX + CW - mainW, mainCx = mainX + mainW / 2;
const sideW = 80, sideX = MX, sideCx = sideX + sideW / 2;

function flowBox(cy0, h, title, desc, opts = {}) {
  const x = opts.x !== undefined ? opts.x : mainX;
  const w = opts.w !== undefined ? opts.w : mainW;
  rect(x, cy0, w, h, { fill: opts.fill || BOX_BG });
  const lines = [{ t: title, size: opts.titleSize || 3.3, weight: 700, color: opts.titleColor || INK }];
  (desc || []).forEach(d => lines.push({ t: d, size: 2.6, weight: 400, color: GRAY }));
  const lineGap = 1.3;
  const blockH = lines.reduce((s, l) => s + l.size * lineGap, 0);
  const topY = cy0 + (h - blockH) / 2 - (lines[0].size * 0.15);
  textBlock(x + w / 2, topY, lines, { align: "middle", lineGap });
  return { x, y: cy0, w, h, cx: x + w / 2, cy: cy0 + h / 2 };
}

function downArrow(fromBox, toY, label, opts = {}) {
  arrow(`M${fromBox.cx},${fromBox.y + fromBox.h} L${fromBox.cx},${toY}`, opts);
  if (label) arrowLabel(fromBox.cx + (opts.labelDx || 22), (fromBox.y + fromBox.h + toY) / 2, label, { size: 2.4 });
}

// ---- 1. input ----
const F1 = flowBox(f2y, 17, "استقبال قياس", [
  "معرّف القياس، الإحداثيات، وقت التسجيل، الدقة، والمصدر",
  "+ وقت الوصول (يضيفه الخادم عند الاستلام)"
]);
f2y += 17 + 5;

// ---- 2. duplicate? ----
const D1 = { cx: mainCx, cy: f2y + 8, w: 78, h: 17 };
diamond(D1.cx, D1.cy, D1.w, D1.h);
textBlock(D1.cx, D1.cy - 4.6, [{ t: "معرّف القياس", size: 2.7, weight: 700 }, { t: "مكرر؟", size: 2.7, weight: 700 }], { align: "middle", lineGap: 1.3 });
arrow(`M${F1.cx},${F1.y + F1.h} L${F1.cx},${D1.cy - D1.h / 2}`, {});

// YES -> compact dead-end note, kept fully inside the main column (left of the diamond)
{
  const nw = 46, nh = 14, nx = mainX + nw / 2 + 1, ny = D1.cy;
  rect(nx - nw / 2, ny - nh / 2, nw, nh, { fill: FRAME_BG, stroke: LINE });
  textBlock(nx, ny - nh / 2 + 1.3, [
    { t: "تأكيد الاستلام دون احتساب", size: 2.35, weight: 700 },
    { t: "(تُربط النسخة بمصدرها الأصلي)", size: 2.15, weight: 400, color: GRAY }
  ], { align: "middle", lineGap: 1.3 });
  arrow(`M${D1.cx - D1.w / 2},${D1.cy} L${nx + nw / 2 + 3},${ny}`, {});
  arrowLabel((D1.cx - D1.w / 2 + nx + nw / 2 + 3) / 2, D1.cy - D1.h / 2 - 2, "نعم", { size: 2.3 });
}
f2y = D1.cy + D1.h / 2 + 5;

// ---- 3. late-evidence decision (also encodes "تحديد موضع الدليل في الزمن") ----
const D2 = { cx: mainCx, cy: f2y + 10, w: 84, h: 21 };
diamond(D2.cx, D2.cy, D2.w, D2.h);
textBlock(D2.cx, D2.cy - 6.8, [
  { t: "تحديد موضع الدليل زمنيًا:", size: 2.6, weight: 700 },
  { t: "هل هو متأخر عن آخر", size: 2.5, weight: 400 },
  { t: "حالة محسوبة؟", size: 2.5, weight: 400 }
], { align: "middle", lineGap: 1.28 });
arrow(`M${D1.cx},${D1.cy + D1.h / 2} L${D2.cx},${D2.cy - D2.h / 2}`, {});
arrowLabel(D2.cx + 20, (D1.cy + D1.h / 2 + D2.cy - D2.h / 2) / 2, "لا");

// YES -> compact note, kept fully inside the main column (left of the diamond), then rejoins below
{
  const nw = 50, nh = 19, nx = mainX + nw / 2 + 1, ny = D2.cy;
  rect(nx - nw / 2, ny - nh / 2, nw, nh, { fill: FRAME_BG, stroke: LINE });
  textBlock(nx, ny - nh / 2 + 1.3, [
    { t: "استرجاع نقطة استعادة سابقة", size: 2.3, weight: 700, color: TRIGGER },
    { t: "تسبق وقت حدوث الدليل، ثم", size: 2.1, weight: 400, color: GRAY },
    { t: "إدراجه ضمن التسلسل الزمني", size: 2.1, weight: 400, color: GRAY }
  ], { align: "middle", lineGap: 1.25 });
  arrow(`M${D2.cx - D2.w / 2},${D2.cy} L${nx + nw / 2 + 3},${ny}`, { color: TRIGGER, marker: "arrowTrigger" });
  arrowLabel(D2.cx - D2.w / 2 - 7, D2.cy - D2.h / 2 - 3, "نعم", { color: TRIGGER, size: 2.5, align: "middle" });
  // rejoin arrow from the note down to the merge point
  arrow(`M${nx},${ny + nh / 2} L${nx},${D2.cy + D2.h / 2 + 9} L${D2.cx},${D2.cy + D2.h / 2 + 9}`, { dash: "1.4,1.2", sw: 0.45 });
}

f2y = D2.cy + D2.h / 2 + 5;
const mergeY = f2y + 4;
arrow(`M${D2.cx},${D2.cy + D2.h / 2} L${D2.cx},${mergeY}`, {});
arrowLabel(D2.cx + 14, D2.cy + D2.h / 2 + 2, "لا — إدراج مباشر", { size: 2.2 });
els.push(`<circle cx="${D2.cx}" cy="${mergeY}" r="1.1" fill="${INK}"/>`);
f2y = mergeY + 5;

// ---- 4. motion estimation ----
const F2 = flowBox(f2y, 20, "تقدير الحركة", [
  "حساب أزمنة عبور الطرق من الطول والسرعة المفترضة",
  "ومعامل التضاريس؛ ترجيح المسارات وفق خطة الرحلة",
  "مع إبقاء بدائل ممكنة"
]);
arrow(`M${D2.cx},${mergeY} L${F2.cx},${F2.y}`, {});
f2y += 20 + 5;

// ---- 5. weight update (+ formula) ---- [manual layout: title, then formula, then note — no auto-centering]
const F3H = 22;
rect(mainX, f2y, mainW, F3H);
const F3 = { x: mainX, y: f2y, w: mainW, h: F3H, cx: mainCx, cy: f2y + F3H / 2 };
{
  const fx = F3.cx;
  els.push(`<text x="${fx}" y="${(F3.y + 5.5).toFixed(2)}" font-size="3.3" font-weight="700" fill="${INK}" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">تحديث الأوزان</text>`);
  els.push(`<text x="${fx}" y="${(F3.y + 11.3).toFixed(2)}" font-size="2.75" font-weight="700" fill="${ACCENT}" text-anchor="middle" font-family="'Courier New',monospace" direction="ltr">الوزن المحدَّث = تطبيع( الوزن المتوقع × معامل توافق الدليل )</text>`);
  textBlock(fx, F3.y + 13.6, [
    { t: "معامل التوافق يعتمد على الموقع والدقة والمصدر —", size: 2.3, color: GRAY },
    { t: "ترجيحات نموذج داخلية، وليست نسب دقة مثبتة", size: 2.3, color: GRAY }
  ], { align: "middle", lineGap: 1.3 });
}
downArrow(F2, F3.y, null);
f2y += F3H + 5;

// ---- 6. zone ranking (+ formula) ---- [manual layout]
const F4H = 35;
rect(mainX, f2y, mainW, F4H);
const F4 = { x: mainX, y: f2y, w: mainW, h: F4H, cx: mainCx, cy: f2y + F4H / 2 };
{
  const fx = F4.cx;
  els.push(`<text x="${fx}" y="${(F4.y + 5.5).toFixed(2)}" font-size="3.3" font-weight="700" fill="${INK}" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">ترتيب مناطق البحث</text>`);
  els.push(`<text x="${fx}" y="${(F4.y + 12.3).toFixed(2)}" font-size="3.6" font-weight="700" fill="${ACCENT}" text-anchor="middle" font-family="'Courier New',monospace" direction="ltr">S = W / (T_access + T_search + τ₀)</text>`);
  let fy1 = F4.y + 17.2;
  const symLines = [
    "W: مجموع أوزان الحالات داخل المنطقة",
    "T_access: زمن الوصول المقدَّر إليها",
    "T_search: زمن التفتيش المقدَّر لها",
    "τ₀: ثابت زمني موجب (بالوحدة نفسها) لتفادي القسمة على صفر",
  ];
  symLines.forEach((s, i) => {
    els.push(`<text x="${fx}" y="${(fy1 + i * 3.5).toFixed(2)}" font-size="2.35" fill="${GRAY}" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">${esc(s)}</text>`);
  });
  fy1 += symLines.length * 3.5 + 2;
  els.push(`<text x="${fx}" y="${fy1.toFixed(2)}" font-size="2.75" font-weight="700" fill="${INK}" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">الناتج S يُسمَّى «مؤشر أولوية تقديري» — وليس نسبة دقة</text>`);
}
downArrow(F3, F4.y, null);
f2y += F4H + 5;

// ---- 7. publish ----
const F5 = flowBox(f2y, 17, "نشر إصدار جديد", [
  "حفظ النتيجة مع معرّفات الأدلة وإعدادات النموذج،",
  "وعرض أسباب تغيّر الأولويات للمسؤول عن البحث"
]);
downArrow(F4, F5.y, null);
f2y += 17 + 6;

// ref chip to 108
{
  const rw = 60, rh = 10;
  rect(F5.cx - rw / 2, f2y, rw, rh, { fill: FRAME_BG, stroke: LINE, rx: 5 });
  textBlock(F5.cx, f2y + 1.2, [{ t: "→ إلى واجهة المتابعة (108)", size: 2.5, weight: 700, color: ACCENT }], { align: "middle", lineGap: 1.3 });
  arrow(`M${F5.cx},${F5.y + F5.h} L${F5.cx},${f2y}`, {});
  f2y += rh;
}

const mainFlowBottom = f2y;

/* ---- independent side lane: deadline monitoring ---- */
const laneTop = fig2Top + 10;
const S1 = flowBox(laneTop + 10, 19, "مراقبة موعد الاطمئنان", [
  "مقارنة دورية: الساعة الحالية مقابل موعد", "الاطمئنان + المهلة (محفوظتان بالخادم)"
], { x: sideX, w: sideW, titleColor: ALERT });
els.push(`<text x="${sideCx}" y="${laneTop + 5}" font-size="3.1" font-weight="700" fill="${ALERT}" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">مسار مستقل</text>`);

const DS1 = { cx: sideCx, cy: S1.y + S1.h + 16, w: 72, h: 20 };
arrow(`M${S1.cx},${S1.y + S1.h} L${DS1.cx},${DS1.cy - DS1.h / 2}`, { color: ALERT });
diamond(DS1.cx, DS1.cy, DS1.w, DS1.h, { stroke: ALERT });
textBlock(DS1.cx, DS1.cy - 6, [
  { t: "تجاوز الموعد", size: 2.6, weight: 700, color: ALERT },
  { t: "دون تأكيد سلامة؟", size: 2.5, weight: 400 }
], { align: "middle", lineGap: 1.3 });

// NO -> loop back to S1
arrow(`M${DS1.cx - DS1.w / 2},${DS1.cy} L${sideX - 6},${DS1.cy} L${sideX - 6},${S1.cy} L${S1.x},${S1.cy}`, { color: ALERT, sw: 0.45 });
arrowLabel(sideX - 8, (DS1.cy + S1.cy) / 2, "لا — استمرار المراقبة", { align: "middle", size: 2.15, color: ALERT });

// YES -> create alert -> reference to 108
const AS1 = flowBox(DS1.cy + DS1.h / 2 + 8, 14, "إنشاء تنبيه تأخر", [], { x: sideX, w: sideW, titleColor: ALERT, fill: "#FDF0EC" });
arrow(`M${DS1.cx},${DS1.cy + DS1.h / 2} L${AS1.cx},${AS1.y}`, { color: ALERT, marker: "arrowAlert" });
arrowLabel(AS1.cx + 16, DS1.cy + DS1.h / 2 + 3, "نعم", { color: ALERT });

{
  const rw = 60, rh = 10, ry2 = AS1.y + AS1.h + 5;
  rect(AS1.cx - rw / 2, ry2, rw, rh, { fill: "#FDF0EC", stroke: ALERT, rx: 5 });
  textBlock(AS1.cx, ry2 + 1.2, [{ t: "→ إلى واجهة المتابعة (108)", size: 2.5, weight: 700, color: ALERT }], { align: "middle", lineGap: 1.3 });
  arrow(`M${AS1.cx},${AS1.y + AS1.h} L${AS1.cx},${ry2}`, { color: ALERT, marker: "arrowAlert" });

  // callout note under the lane
  note(sideX, ry2 + rh + 8, sideW, 16, [
    "وصول موقع جديد وحده", "لا يُعد تأكيدًا للسلامة"
  ], { size: 2.5, weight: 700 });
}

y = Math.max(mainFlowBottom, DS1.cy + DS1.h / 2 + 8 + 14 + 5 + 10 + 8 + 16) + 12;

/* =========================================================================================
   FIGURE 3 — مثال توضيحي: موقع متأخر
   ========================================================================================= */
const fig3Top = y;
sectionLabel(MX + CW, fig3Top + 5, 3, "مثال يشرح التعامل مع موقع متأخر", { align: "start", size: 5.6 });
let f3y = fig3Top + 12;

// ---- timeline strip ----
const tlY = f3y + 8, tlLeft = MX + 10, tlRight = MX + CW - 10;
els.push(`<line x1="${tlLeft}" y1="${tlY}" x2="${tlRight}" y2="${tlY}" stroke="${INK}" stroke-width="0.6"/>`);
// RTL timeline: 16:00 on the right -> 16:40 on the left
const t1600x = tlRight, t1620x = tlRight - (tlRight - tlLeft) * 0.5, t1640x = tlLeft;

function tlPoint(x, time, top, bottom, color) {
  els.push(`<circle cx="${x}" cy="${tlY}" r="1.6" fill="${color}" stroke="#fff" stroke-width="0.4"/>`);
  els.push(`<text x="${x}" y="${tlY - 5}" font-size="3.4" font-weight="700" fill="${color}" text-anchor="middle" font-family="'Courier New',monospace" direction="ltr">${time}</text>`);
  textBlock(x, tlY + 4, bottom.map(t => ({ t, size: 2.4, color: GRAY })), { align: "middle", lineGap: 1.3 });
}
tlPoint(t1600x, "16:00", null, ["آخر قياس مستلم", "(بينما الاتصال متوفر)"], INK);
tlPoint(t1620x, "16:20", null, ["الهاتف يسجّل قياسًا محليًا", "أثناء غياب الاتصال"], ACCENT);
tlPoint(t1640x, "16:40", null, ["القياس المسجَّل عند 16:20", "يصل إلى الخادم الآن"], ALERT);

// bracket under the 16:20 -> 16:40 span
{
  const by = tlY + 15.5, bx1 = t1620x, bx2 = t1640x;
  els.push(`<path d="M${bx1},${by - 2} L${bx1},${by} L${bx2},${by} L${bx2},${by - 2}" fill="none" stroke="${TRIGGER}" stroke-width="0.5"/>`);
  arrowLabel((bx1 + bx2) / 2, by + 3.6, "إعادة تقدير الحركة خلال هذه الفترة عند وصول القياس", { color: TRIGGER, size: 2.3 });
}
f3y = tlY + 22;

// ---- illustrative branching-road map ----
const mapY = f3y, mapH = 58;
rect(MX, mapY, CW, mapH, { fill: FRAME_BG, stroke: LINE });
els.push(`<text x="${MX + CW - 6}" y="${mapY + 6}" font-size="2.9" font-weight="700" fill="${INK}" text-anchor="start" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">خريطة تخطيطية — طريق متفرّع</text>`);

const roadOx = MX + CW - 55, roadOy = mapY + 12; // fork origin (near 16:20 point, right-ish)
// incoming road (from earlier / east)
els.push(`<path d="M${MX + CW - 12},${mapY + 10} L${roadOx},${roadOy}" fill="none" stroke="${INK}" stroke-width="0.9"/>`);
// two branches downstream (solid roads — the road network itself is "known", not the estimate)
const branchA = { x: MX + 70, y: mapY + 24 };
const branchB = { x: MX + 40, y: mapY + 48 };
els.push(`<path d="M${roadOx},${roadOy} L${branchA.x},${branchA.y}" fill="none" stroke="${INK}" stroke-width="0.9"/>`);
els.push(`<path d="M${roadOx},${roadOy} L${branchB.x},${branchB.y}" fill="none" stroke="${INK}" stroke-width="0.9"/>`);
// branch A continues to two candidate ends
const endA1 = { x: MX + 30, y: mapY + 14 };
const endA2 = { x: MX + 20, y: mapY + 32 };
els.push(`<path d="M${branchA.x},${branchA.y} L${endA1.x},${endA1.y}" fill="none" stroke="${INK}" stroke-width="0.9"/>`);
els.push(`<path d="M${branchA.x},${branchA.y} L${endA2.x},${endA2.y}" fill="none" stroke="${INK}" stroke-width="0.9"/>`);

// recorded location at 16:20 — SOLID marker (per legend: recorded measurement)
els.push(`<circle cx="${roadOx}" cy="${roadOy}" r="2.2" fill="${ACCENT}" stroke="#fff" stroke-width="0.5"/>`);
els.push(`<text x="${roadOx + 4}" y="${roadOy - 3}" font-size="2.6" font-weight="700" fill="${ACCENT}" text-anchor="start" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">موقع مسجَّل عند 16:20</text>`);

// estimated zones at 16:40 — DASHED blobs (per legend: estimated area/location)
function estZone(cx, cy, r, n) {
  els.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${TRIGGER}" fill-opacity="0.14" stroke="${TRIGGER}" stroke-width="0.6" stroke-dasharray="1.6,1.2"/>`);
  els.push(`<circle cx="${cx}" cy="${cy}" r="1.6" fill="${TRIGGER}"/>`);
  els.push(`<text x="${cx}" y="${cy + 0.9}" font-size="2.1" font-weight="700" fill="#fff" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">${n}</text>`);
}
estZone(endA1.x, endA1.y, 6.5, "١");
estZone(endA2.x, endA2.y, 5.5, "٢");
estZone(branchB.x, branchB.y, 6.5, "٣");
els.push(`<text x="${endA1.x}" y="${mapY + 9}" font-size="2.5" font-weight="700" fill="${TRIGGER}" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">مناطق تقديرية محسوبة عند 16:40</text>`);

// explicit caution note
note(MX + CW - 96, mapY + mapH - 24, 90, 18, [
  "الموقع 16:20 هو آخر نقطة مسجَّلة فقط —",
  "لا يُعرض كموقع حالي مؤكَّد للشخص"
], { size: 2.15, weight: 700, fill: "#FDF3EC", stroke: TRIGGER });

f3y = mapY + mapH + 6;
els.push(`<text x="${MX + CW / 2}" y="${f3y + 4}" font-size="3.4" font-weight="700" fill="${INK}" text-anchor="middle" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">مثال توضيحي لآلية المعالجة</text>`);
y = f3y + 8;

/* =========================================================================================
   DESIGN NOTE (required by the brief: surface any conflict rather than hide it)
   ========================================================================================= */
{
  const nh = 22;
  rect(MX, y, CW, nh, { fill: "#FBFCFD", stroke: LINE, sw: 0.4, rx: 1.6 });
  els.push(`<text x="${MX + CW - 5}" y="${y + 5.5}" font-size="3.2" font-weight="700" fill="${INK}" text-anchor="start" font-family="'Noto Kufi Arabic','Arial',sans-serif" direction="rtl">ملاحظة تصميم</text>`);
  textBlock(MX + CW / 2, y + 8, [
    { t: "آلية «تأكيد السلامة» من المسافر (لإلغاء تنبيه التأخر) لم تُفصَّل ضمن نطاق المكونات (101–108) المطلوب. افتراضًا،", size: 2.55, color: GRAY },
    { t: "هي تصل عبر القناة نفسها المستخدمة لبيانات (101)←(102) دون إضافة مكوّن جديد يخفي هذه الفجوة في المواصفة.", size: 2.55, color: GRAY }
  ], { align: "middle", lineGap: 1.35 });
  y += nh + 6;
}

PAGE_H = y + 8; // trim canvas to final content height + bottom margin

/* =========================================================================================
   ASSEMBLE + WRITE — standalone editable SVG (fonts embedded) + preview HTML
   ========================================================================================= */
const fontsDir = path.join(ROOT, "assets/fonts");
const fontFaceCss = fs.readFileSync(path.join(fontsDir, "fonts.css"), "utf8")
  .replace(/url\((f\d+\.woff2)\)/g, (m, fname) => {
    const b64 = fs.readFileSync(path.join(fontsDir, fname)).toString("base64");
    return `url(data:font/woff2;base64,${b64})`;
  });

const svgBody = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W * 11.811}" height="${PAGE_H * 11.811}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
<defs>
<style>${fontFaceCss}</style>
${defs.join("")}
</defs>
<rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="#FFFFFF"/>
${els.join("\n")}
</svg>`;

fs.writeFileSync(path.join(ROOT, "04-technical-diagram/Athar_Technical_Diagram.svg"), svgBody);

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="../assets/fonts/fonts.css" rel="stylesheet">
<style>*{margin:0;padding:0;} body{width:${PAGE_W * 11.811}px;height:${PAGE_H * 11.811}px;}</style>
</head><body>${svgBody}</body></html>`;

fs.writeFileSync(path.join(ROOT, "04-technical-diagram/diagram.html"), html);
console.log("wrote SVG + HTML. PAGE_W=", PAGE_W, "PAGE_H=", PAGE_H, "-> px:", Math.round(PAGE_W * 11.811), "x", Math.round(PAGE_H * 11.811));
