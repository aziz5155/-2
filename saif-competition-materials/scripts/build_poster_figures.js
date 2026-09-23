// Builds the three English, poster-legible figures for the ATHAR SAIF 2026 poster content
// package. Each figure is a standalone mm-based SVG (1 unit = 1mm, px = mm * 11.811 for 300dpi)
// sized at a generic landscape column width so it can be dropped into the official template and
// rescaled without redoing the artwork. LTR English text — no RTL gotchas here.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "05-poster-saif2026", "figures");
fs.mkdirSync(OUT, { recursive: true });

const INK = "#101820", GRAY = "#5A6472", LINE = "#B9C0CB", FRAME_BG = "#F4F6F9", BOX_BG = "#FFFFFF";
const ACCENT = "#0E3F3C"; // deep evergreen, matches the 18+ category color
const ACCENT2 = "#1C7A70";
const TRIGGER = "#B65C1F";
const ALERT = "#B0392B";
const FONT = "'Arial','Helvetica',sans-serif";

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function makeDoc(PAGE_W, PAGE_H) {
  const els = [];
  const defs = [`
    <marker id="arrowData" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L6,3 L0,6 Z" fill="${INK}"/>
    </marker>
    <marker id="arrowTrigger" markerWidth="9" markerHeight="9" refX="6.5" refY="3.5" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L7,3.5 L0,7" fill="none" stroke="${TRIGGER}" stroke-width="1.1"/>
    </marker>
    <marker id="arrowAlert" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L6,3 L0,6 Z" fill="${ALERT}"/>
    </marker>
  `];

  function rect(x, y, w, h, opts = {}) {
    const { fill = BOX_BG, stroke = INK, sw = 0.7, rx = 1.2, dash } = opts;
    els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`);
  }
  function diamond(cx, cy, w, h, opts = {}) {
    const { fill = BOX_BG, stroke = INK, sw = 0.7 } = opts;
    els.push(`<polygon points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);
  }
  function textBlock(cx, topY, lines, opts = {}) {
    const { align = "middle", lineGap = 1.3 } = opts;
    let y = topY;
    lines.forEach(ln => {
      y += ln.size;
      const anchor = align;
      const mono = ln.mono ? `font-family="'Courier New',monospace"` : `font-family="${FONT}"`;
      els.push(`<text x="${cx}" y="${y.toFixed(2)}" font-size="${ln.size}" font-weight="${ln.weight || 400}" fill="${ln.color || INK}" text-anchor="${anchor}" ${mono}>${esc(ln.t)}</text>`);
      y += ln.size * (lineGap - 1);
    });
    return y;
  }
  function box(x, y, w, h, lines, opts = {}) {
    rect(x, y, w, h, opts);
    const blockH = lines.reduce((s, l) => s + l.size * 1.28, 0);
    const topY = y + (h - blockH) / 2 - lines[0].size * 0.15;
    textBlock(x + w / 2, topY, lines, { align: "middle", lineGap: 1.28 });
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  }
  function arrow(d, opts = {}) {
    const { color = INK, sw = 0.9, dash, marker = "arrowData" } = opts;
    els.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ""} marker-end="url(#${marker})"/>`);
  }
  function label(x, y, text, opts = {}) {
    const { size = 3.6, color = INK, align = "middle", bg = true, weight = 400 } = opts;
    if (bg) {
      const w = text.length * size * 0.56 + 3;
      els.push(`<rect x="${(align === "middle" ? x - w / 2 : align === "start" ? x : x - w).toFixed(2)}" y="${(y - size * 1.05).toFixed(2)}" width="${w.toFixed(2)}" height="${(size * 1.5).toFixed(2)}" fill="#FFFFFF" opacity="0.9"/>`);
    }
    els.push(`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${align}" font-family="${FONT}">${esc(text)}</text>`);
  }
  function caption(x, y, w, num, title, body) {
    els.push(`<text x="${x}" y="${y}" font-size="4.4" font-weight="700" fill="${INK}" font-family="${FONT}">${esc(num)}. ${esc(title)}</text>`);
    const words = body.split(" ");
    const maxCharsPerLine = Math.floor(w / 1.85);
    let lines = [], cur = "";
    words.forEach(word => {
      if ((cur + " " + word).trim().length > maxCharsPerLine) { lines.push(cur.trim()); cur = word; }
      else cur += " " + word;
    });
    if (cur.trim()) lines.push(cur.trim());
    let ly = y + 5.5;
    lines.forEach(l => {
      els.push(`<text x="${x}" y="${ly}" font-size="3.3" fill="${GRAY}" font-family="${FONT}">${esc(l)}</text>`);
      ly += 4.3;
    });
    return ly;
  }

  function svg() {
    const pxW = (PAGE_W * 11.811).toFixed(0), pxH = (PAGE_H * 11.811).toFixed(0);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_W} ${PAGE_H}" width="${pxW}" height="${pxH}">
      <defs>${defs.join("")}</defs>
      <rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="#FFFFFF"/>
      ${els.join("\n")}
    </svg>`;
  }
  return { els, rect, diamond, textBlock, box, arrow, label, caption, svg };
}

function writeFig(name, PAGE_W, PAGE_H, svgStr) {
  const svgPath = path.join(OUT, `${name}.svg`);
  fs.writeFileSync(svgPath, svgStr);
  const htmlPath = path.join(OUT, `${name}.html`);
  fs.writeFileSync(htmlPath, `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;}</style></head><body>${svgStr}</body></html>`);
  console.log(`${name}: ${PAGE_W}mm x ${PAGE_H}mm -> ${(PAGE_W * 11.811).toFixed(0)}x${(PAGE_H * 11.811).toFixed(0)}px`);
}

/* =====================================================================================
   FIGURE 1 — Proposed system architecture
   (client row above, full-width backend frame below, gap-zone arrow routing —
   the same layout pattern already proven collision-free in the SAIP technical diagram)
   ===================================================================================== */
{
  const W = 300, H = 205;
  const d = makeDoc(W, H);
  const MX = 8;

  // client row: traveler app (left) and monitor interface (right), above the frame
  const clientY = 14, clientH = 26;
  const app = d.box(MX, clientY, 70, clientH, [
    { t: "Traveler App", size: 5.2, weight: 700 },
    { t: "Flutter", size: 3.6, color: ACCENT2, mono: true },
    { t: "Trip plan, deadline, vehicle & passenger data", size: 3.0, color: GRAY }
  ]);
  const monitor = d.box(W - MX - 70, clientY, 70, clientH, [
    { t: "Monitor Interface", size: 5.2, weight: 700 },
    { t: "MapLibre GL JS", size: 3.6, color: ACCENT2, mono: true },
    { t: "Trusted contact / search lead", size: 3.0, color: GRAY }
  ]);
  const clientBottom = clientY + clientH;

  // backend frame (full width), gap zone above it carries the cross-boundary arrows
  const frameTop = clientBottom + 20;
  const padTop = 9, rowH1 = 20, rowH2 = 18, rowH3 = 20, rankH = 22, gapR = 5, padBot = 8;
  const frameH = padTop + rowH1 + gapR + rowH2 + gapR + rowH3 + gapR + rankH + padBot;
  d.rect(MX, frameTop, W - MX * 2, frameH, { fill: FRAME_BG, stroke: INK, sw: 0.8 });
  d.label(MX + (W - MX * 2) / 2, frameTop + 6, "Hosted server-side services (ordinary cloud hosting)", { size: 3.6, weight: 700, bg: false });

  const padX = 9, ix1 = MX + padX, ix2 = W - MX - padX, halfW = (ix2 - ix1 - gapR) / 2;
  let ry = frameTop + padTop;

  const intake = d.box(ix1, ry, halfW, rowH1, [
    { t: "Evidence Intake", size: 4.3, weight: 700 },
    { t: "Python · FastAPI", size: 3.1, color: ACCENT2, mono: true },
    { t: "Validate, timestamp, dedupe", size: 3.0, color: GRAY }
  ]);
  const deadline = d.box(ix1 + halfW + gapR, ry, halfW, rowH1, [
    { t: "Deadline Monitor", size: 4.3, weight: 700, color: ALERT },
    { t: "Independent background check", size: 3.0, color: GRAY }
  ]);

  ry += rowH1 + gapR;
  const store = d.box(ix1, ry, ix2 - ix1, rowH2, [
    { t: "Spatial-Temporal Store", size: 4.3, weight: 700 },
    { t: "PostgreSQL · PostGIS", size: 3.1, color: ACCENT2, mono: true },
    { t: "Trips, evidence, checkpoints, map versions", size: 3.0, color: GRAY }
  ]);

  ry += rowH2 + gapR;
  const late = d.box(ix1, ry, halfW, rowH3, [
    { t: "Late-Evidence Handler", size: 4.3, weight: 700 },
    { t: "Restore → Insert → Replay", size: 3.0, color: TRIGGER, weight: 700 }
  ]);
  const engine = d.box(ix1 + halfW + gapR, ry, halfW, rowH3, [
    { t: "Analysis Engine", size: 4.3, weight: 700 },
    { t: "Python · NumPy · H3 · NetworkX", size: 2.75, color: ACCENT2, mono: true },
    { t: "Bayesian weight update", size: 3.0, color: GRAY }
  ]);

  ry += rowH3 + gapR;
  const rank = d.box(ix1, ry, ix2 - ix1, rankH, [
    { t: "Search-Area Ranking", size: 4.3, weight: 700 },
    { t: "Aggregates weights by region; ranks by access + search effort", size: 3.0, color: GRAY }
  ]);
  const frameBottom = frameTop + frameH;

  // ---- gap-zone arrows (three distinct horizontal bands: 0.3 / 0.5 / 0.72 — proven spacing) ----
  const gapY1 = clientBottom + (frameTop - clientBottom) * 0.3;  // measurement batch: app -> intake
  d.arrow(`M${app.cx},${clientBottom} L${app.cx},${gapY1} L${intake.cx},${gapY1} L${intake.cx},${intake.y}`, {});
  d.label((app.cx + intake.cx) / 2, gapY1 - 2, "measurement batch", { size: 3.0 });

  const gapY2 = clientBottom + (frameTop - clientBottom) * 0.5;  // feedback: monitor -> intake (dashed)
  d.arrow(`M${monitor.cx - 12},${clientBottom} L${monitor.cx - 12},${gapY2} L${intake.x + 12},${gapY2} L${intake.x + 12},${intake.y}`, { sw: 0.5, dash: "1.4,1.2" });
  d.label((monitor.cx - 12 + intake.x + 12) / 2, gapY2 + 3, "new sighting / inspection log", { size: 2.7 });

  const gapY3 = clientBottom + (frameTop - clientBottom) * 0.72; // deadline alert: deadline -> monitor
  d.arrow(`M${deadline.cx},${deadline.y} L${deadline.cx},${gapY3} L${monitor.cx},${gapY3} L${monitor.cx},${clientBottom}`, { color: ALERT, marker: "arrowAlert" });
  d.label(deadline.cx, gapY3 + 3, "deadline alert", { size: 3.0, color: ALERT });

  // ---- interior arrows ----
  d.arrow(`M${intake.cx},${intake.y + intake.h} L${intake.cx},${store.y}`, {});
  d.arrow(`M${deadline.cx},${deadline.y + deadline.h} L${deadline.cx},${store.y}`, { sw: 0.5 });
  d.arrow(`M${store.cx},${store.y + store.h} L${engine.cx},${engine.y}`, {});
  d.arrow(`M${late.x + late.w},${late.cy} L${engine.x},${engine.cy}`, { color: TRIGGER, marker: "arrowTrigger" });
  d.label((late.x + late.w + engine.x) / 2, late.cy - 3, "recompute", { size: 2.9, color: TRIGGER });
  d.arrow(`M${store.x + 14},${store.y + store.h} L${late.cx},${store.y + store.h + 2} L${late.cx},${late.y}`, { sw: 0.5 });
  d.arrow(`M${engine.cx},${engine.y + engine.h} L${engine.cx},${rank.y}`, {});

  // ranked regions: rank -> monitor, routed up the frame's right padding channel then through the gap zone
  {
    const rx = ix2 + 4;
    const gapY4 = clientBottom + (frameTop - clientBottom) * 0.5;
    d.arrow(`M${rank.x + rank.w - 10},${rank.y} L${rank.x + rank.w - 10},${rank.y - 3} L${rx},${rank.y - 3} L${rx},${gapY4} L${monitor.cx + 12},${gapY4} L${monitor.cx + 12},${clientBottom}`, {});
    d.els.push(`<text x="${(rx + 2).toFixed(2)}" y="${((rank.y + gapY4) / 2).toFixed(2)}" font-size="2.6" fill="${INK}" font-family="${FONT}" transform="rotate(-90 ${(rx + 2).toFixed(2)} ${((rank.y + gapY4) / 2).toFixed(2)})" text-anchor="middle">ranked regions</text>`);
  }

  d.label(MX + (W - MX * 2) / 2, frameBottom + 6, "Design-stage architecture — not a deployed system", { size: 3.0, color: GRAY, bg: false });

  // legend strip
  const legY = H - 22;
  d.rect(MX, legY, W - MX * 2, 14, { fill: "#FBFCFD", stroke: LINE, sw: 0.5 });
  const chips = [
    ["data arrow", (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="${INK}" stroke-width="0.7" marker-end="url(#arrowData)"/>`],
    ["recompute trigger", (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="${TRIGGER}" stroke-width="0.8" marker-end="url(#arrowTrigger)"/>`],
    ["deadline alert", (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="${ALERT}" stroke-width="0.8" marker-end="url(#arrowAlert)"/>`],
    ["feedback (dashed)", (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="${INK}" stroke-width="0.5" stroke-dasharray="1.4,1.2"/>`],
  ];
  let lx = MX + 6;
  chips.forEach(([txt, draw]) => {
    d.els.push(draw(lx, legY + 7));
    d.els.push(`<text x="${lx + 15}" y="${legY + 8.5}" font-size="3.2" fill="${INK}" font-family="${FONT}">${esc(txt)}</text>`);
    lx += 15 + txt.length * 2.0 + 10;
  });

  writeFig("figure1-architecture", W, H, d.svg());
}

/* =====================================================================================
   FIGURE 2 — Observation-time processing of delayed evidence
   ===================================================================================== */
{
  const W = 300, H = 100;
  const d = makeDoc(W, H);
  const MX = 10;
  const steps = [
    ["Restore", "Load the checkpoint saved just before the evidence's observed time"],
    ["Insert", "Place the fix into the evidence log at its observed time, not its arrival time"],
    ["Replay", "Re-run every later fix in the corrected order"],
    ["Predict", "Re-estimate movement across the affected interval"],
    ["Publish", "Save a new, audit-linked map version"]
  ];
  const n = steps.length, gap = 10, bw = (W - MX * 2 - gap * (n - 1)) / n, by = 30, bh = 38;
  let bx = MX;
  const boxes = [];
  steps.forEach(([title, body], i) => {
    const bx0 = bx;
    d.rect(bx0, by, bw, bh, { fill: i === 0 ? FRAME_BG : BOX_BG, stroke: i === 0 ? TRIGGER : INK, sw: 0.8 });
    d.label(bx0 + bw / 2, by + 9, `${i + 1}`, { size: 6.5, weight: 700, color: i === 0 ? TRIGGER : ACCENT, bg: false });
    d.label(bx0 + bw / 2, by + 17, title, { size: 4.6, weight: 700, bg: false });
    // wrapped body text
    const words = body.split(" ");
    const maxChars = Math.floor((bw - 6) / 1.55);
    let lines = [], cur = "";
    words.forEach(w => { if ((cur + " " + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; } else cur += " " + w; });
    if (cur.trim()) lines.push(cur.trim());
    let ly = by + 23;
    lines.forEach(l => { d.els.push(`<text x="${bx0 + bw / 2}" y="${ly}" font-size="2.85" fill="${GRAY}" text-anchor="middle" font-family="${FONT}">${esc(l)}</text>`); ly += 3.6; });
    boxes.push({ x: bx0, y: by, w: bw, h: bh, cx: bx0 + bw / 2, cy: by + bh / 2 });
    bx += bw + gap;
  });
  for (let i = 0; i < boxes.length - 1; i++) {
    d.arrow(`M${boxes[i].x + boxes[i].w},${boxes[i].cy} L${boxes[i + 1].x},${boxes[i + 1].cy}`, { color: i === 0 ? TRIGGER : INK, marker: i === 0 ? "arrowTrigger" : "arrowData" });
  }
  d.label(W / 2, by - 6, "Late fix arrives → recompute path (highlighted step 1) → forward flow", { size: 3.4, weight: 700, bg: false, color: TRIGGER });

  // small note strip
  d.rect(MX, by + bh + 12, W - MX * 2, 16, { fill: "#FDF3EC", stroke: TRIGGER, sw: 0.6 });
  d.label(W / 2, by + bh + 20, "A duplicate fix (same identifier) is acknowledged and excluded here — it never re-enters Restore/Replay.", { size: 3.1, bg: false });

  writeFig("figure2-late-evidence", W, H, d.svg());
}

/* =====================================================================================
   FIGURE 3 — Design-stage search-update illustration (two maps, A/B, at 16:40)
   ===================================================================================== */
{
  const W = 300, H = 150;
  const d = makeDoc(W, H);
  const MX = 8, gap = 10, mapW = (W - MX * 2 - gap) / 2, mapY = 30, mapH = 92;

  // timeline strip at top
  d.label(W / 2, 8, "Evaluation time for both maps: 16:40", { size: 4.0, weight: 700, bg: false });
  const times = [["16:00", "last known fix"], ["16:20", "fix recorded (delayed)"], ["16:40", "fix received; evaluation time"]];
  let tx = MX + 20;
  times.forEach(([t, l], i) => {
    d.label(tx, 16, t, { size: 3.4, weight: 700, bg: false, align: "start" });
    d.label(tx, 20, l, { size: 2.7, color: GRAY, bg: false, align: "start" });
    tx += 95;
  });

  function drawMap(x0, label_, subtitle, showLate) {
    d.rect(x0, mapY, mapW, mapH, { fill: FRAME_BG, stroke: LINE, sw: 0.6 });
    d.label(x0 + mapW / 2, mapY - 3, label_, { size: 4.6, weight: 700, bg: false });
    // road
    const originX = x0 + mapW - 30, originY = mapY + 20;
    d.els.push(`<path d="M${x0 + mapW - 10},${mapY + 12} L${originX},${originY}" stroke="${INK}" stroke-width="0.9" fill="none"/>`);
    const branchA = { x: x0 + 55, y: mapY + 38 }, branchB = { x: x0 + 35, y: mapY + 68 };
    d.els.push(`<path d="M${originX},${originY} L${branchA.x},${branchA.y}" stroke="${INK}" stroke-width="0.9" fill="none"/>`);
    d.els.push(`<path d="M${originX},${originY} L${branchB.x},${branchB.y}" stroke="${INK}" stroke-width="0.9" fill="none"/>`);
    // recorded fix at 16:00 (both maps)
    d.els.push(`<circle cx="${originX}" cy="${originY}" r="2.4" fill="${INK}" stroke="#fff" stroke-width="0.5"/>`);
    d.label(originX - 4, originY - 5, "16:00 fix", { size: 2.9, align: "end" });

    if (!showLate) {
      // map A: only the broad estimate from the 16:00 fix, no 16:20 evidence yet
      const cx = (branchA.x + branchB.x) / 2, cy = (branchA.y + branchB.y) / 2 + 6;
      d.els.push(`<circle cx="${cx}" cy="${cy}" r="22" fill="${TRIGGER}" fill-opacity="0.13" stroke="${TRIGGER}" stroke-width="0.7" stroke-dasharray="1.8,1.3"/>`);
      d.label(cx + 9, cy + 13, "broad estimate", { size: 3.0, color: TRIGGER, bg: true });
    } else {
      // map B: 16:20 fix inserted + replayed -> narrower estimated zones
      const p1620 = { x: (originX + branchA.x) / 2 + 4, y: (originY + branchA.y) / 2 };
      d.els.push(`<circle cx="${p1620.x}" cy="${p1620.y}" r="2.4" fill="${ACCENT2}" stroke="#fff" stroke-width="0.5"/>`);
      d.label(p1620.x + 6, p1620.y + 7, "16:20 fix", { size: 2.9, color: ACCENT2, align: "start" });
      const zones = [
        { x: branchA.x - 10, y: branchA.y - 6, r: 8, n: "1" },
        { x: branchA.x + 6, y: branchA.y + 10, r: 6.5, n: "2" },
        { x: branchB.x, y: branchB.y + 4, r: 8, n: "3" }
      ];
      zones.forEach(z => {
        d.els.push(`<circle cx="${z.x}" cy="${z.y}" r="${z.r}" fill="${TRIGGER}" fill-opacity="0.15" stroke="${TRIGGER}" stroke-width="0.7" stroke-dasharray="1.8,1.3"/>`);
        d.els.push(`<circle cx="${z.x}" cy="${z.y}" r="1.6" fill="${TRIGGER}"/>`);
        d.els.push(`<text x="${z.x}" y="${z.y + 1}" font-size="3.2" font-weight="700" fill="#fff" text-anchor="middle" font-family="${FONT}">${z.n}</text>`);
      });
    }
    d.label(x0 + mapW / 2, mapY + mapH + 6, subtitle, { size: 2.9, color: GRAY, bg: false });
  }

  drawMap(MX, "A — before 16:20 fix is inserted", "Estimate based on the 16:00 fix only", false);
  drawMap(MX + mapW + gap, "B — after 16:20 fix is replayed", "Estimate updated using the 16:20 fix, replayed to 16:40", true);

  // legend
  const legY = H - 8;
  d.els.push(`<line x1="${MX + 4}" y1="${legY}" x2="${MX + 16}" y2="${legY}" stroke="${INK}" stroke-width="1.4"/>`);
  d.label(MX + 19, legY + 1, "Observed fix", { size: 3.0, bg: false, align: "start" });
  d.els.push(`<line x1="${MX + 60}" y1="${legY}" x2="${MX + 72}" y2="${legY}" stroke="${INK}" stroke-width="0.9"/>`);
  d.label(MX + 75, legY + 1, "Planned route", { size: 3.0, bg: false, align: "start" });
  d.els.push(`<circle cx="${MX + 122}" cy="${legY}" r="4" fill="${TRIGGER}" fill-opacity="0.15" stroke="${TRIGGER}" stroke-width="0.7" stroke-dasharray="1.8,1.3"/>`);
  d.label(MX + 130, legY + 1, "Estimated search region", { size: 3.0, bg: false, align: "start" });

  writeFig("figure3-search-update", W, H, d.svg());
}

console.log("done.");
