// Minimal SVG chart helpers for static mockups (RTL-aware: x runs right-to-left when rtl=true)
window.Charts = {
  // series: [{name,color,data:[..],fill:true,dash:false}], labels:[..]
  line(el, {w, h, labels, series, max, min = 0, ticks = 5, rtl = true, pad = {t: 14, r: 46, b: 34, l: 14}, fmt = v => v, grid = '#EEF2F7', axis = '#94A3B8', font = 'Inter', markers = false, highlight = null}) {
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b, n = labels.length;
    const X = i => rtl ? pad.l + iw - (i * iw / (n - 1)) : pad.l + i * iw / (n - 1);
    const Y = v => pad.t + ih - (v - min) / (max - min) * ih;
    let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;direction:ltr;font-family:${font}">`;
    s += '<defs>' + series.map((se, k) => `<linearGradient id="g${el.id}${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${se.color}" stop-opacity=".22"/><stop offset="1" stop-color="${se.color}" stop-opacity="0"/></linearGradient>`).join('') + '</defs>';
    for (let i = 0; i <= ticks; i++) { const v = min + (max - min) * i / ticks, y = Y(v);
      s += `<line x1="${pad.l}" x2="${pad.l + iw}" y1="${y}" y2="${y}" stroke="${grid}" ${i ? 'stroke-dasharray="3 4"' : ''}/>`;
      s += `<text x="${rtl ? w - 4 : 4}" y="${y + 4}" font-size="12" fill="${axis}" text-anchor="${rtl ? 'end' : 'start'}">${fmt(v)}</text>`; }
    labels.forEach((l, i) => s += `<text x="${X(i)}" y="${h - 8}" font-size="12.5" fill="${axis}" text-anchor="middle" font-family="IBM Plex Sans Arabic, Readex Pro, sans-serif">${l}</text>`);
    if (highlight != null) s += `<line x1="${X(highlight)}" x2="${X(highlight)}" y1="${pad.t}" y2="${pad.t + ih}" stroke="#CBD5E1" stroke-dasharray="4 4"/>`;
    series.forEach((se, k) => {
      const pts = se.data.map((v, i) => [X(i), Y(v)]);
      // smooth path (monotone-ish cardinal)
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += se.straight ? ` L${x1},${y1}` : ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
      if (se.fill) s += `<path d="${d} L${pts[pts.length - 1][0]},${pad.t + ih} L${pts[0][0]},${pad.t + ih} Z" fill="url(#g${el.id}${k})"/>`;
      s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="${se.width || 2.5}" stroke-linecap="round" ${se.dash ? 'stroke-dasharray="6 6"' : ''}/>`;
      if (highlight != null && !se.dash) s += `<circle cx="${pts[highlight][0]}" cy="${pts[highlight][1]}" r="6" fill="${se.color}" stroke="#fff" stroke-width="3"/>`;
    });
    el.innerHTML = s + '</svg>';
    return {X, Y};
  },
  // groups: labels; series [{name,color,data}]; grouped vertical bars
  bars(el, {w, h, labels, series, max, ticks = 4, rtl = true, pad = {t: 10, r: 40, b: 34, l: 10}, fmt = v => v, bw = 14, gap = 3, grid = '#EEF2F7', axis = '#94A3B8', font = 'Inter', stacked = false}) {
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b, n = labels.length, step = iw / n;
    const Y = v => pad.t + ih - v / max * ih;
    let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;direction:ltr;font-family:${font}">`;
    for (let i = 0; i <= ticks; i++) { const v = max * i / ticks, y = Y(v);
      s += `<line x1="${pad.l}" x2="${pad.l + iw}" y1="${y}" y2="${y}" stroke="${grid}" ${i ? 'stroke-dasharray="3 4"' : ''}/>`;
      s += `<text x="${rtl ? w - 4 : 4}" y="${y + 4}" font-size="12" fill="${axis}" text-anchor="${rtl ? 'end' : 'start'}">${fmt(v)}</text>`; }
    labels.forEach((l, i) => {
      const cx = rtl ? pad.l + iw - step * (i + .5) : pad.l + step * (i + .5);
      s += `<text x="${cx}" y="${h - 8}" font-size="12.5" fill="${axis}" text-anchor="middle" font-family="IBM Plex Sans Arabic, Readex Pro, sans-serif">${l}</text>`;
      if (stacked) { let acc = 0;
        series.forEach((se, k) => { const v = se.data[i], y0 = Y(acc), y1 = Y(acc + v); acc += v;
          const top = k === series.length - 1, hh = y0 - y1 - (k ? 2 : 0);
          s += top ? `<path d="M${cx - bw / 2},${y0 - (k ? 2 : 0)} V${y1 + 4} Q${cx - bw / 2},${y1} ${cx - bw / 2 + 4},${y1} H${cx + bw / 2 - 4} Q${cx + bw / 2},${y1} ${cx + bw / 2},${y1 + 4} V${y0 - (k ? 2 : 0)} Z" fill="${se.color}"/>`
                   : `<rect x="${cx - bw / 2}" y="${y1}" width="${bw}" height="${Math.max(hh, 0)}" fill="${se.color}"/>`; });
      } else {
        const tw = series.length * bw + (series.length - 1) * gap;
        series.forEach((se, k) => { const x = rtl ? cx + tw / 2 - (k + 1) * bw - k * gap : cx - tw / 2 + k * (bw + gap), y = Y(se.data[i]), y0 = Y(0);
          s += `<path d="M${x},${y0} V${y + 4} Q${x},${y} ${x + 4},${y} H${x + bw - 4} Q${x + bw},${y} ${x + bw},${y + 4} V${y0} Z" fill="${se.color}" ${se.opacity ? `opacity="${se.opacity}"` : ''}/>`; });
      }
    });
    el.innerHTML = s + '</svg>';
  },
  donut(el, {size, thick, parts, center = '', sub = '', font = 'Inter', subFont = 'IBM Plex Sans Arabic', gapDeg = 2.2}) {
    const r = (size - thick) / 2, c = size / 2, tot = parts.reduce((a, p) => a + p.v, 0);
    let a0 = -90, s = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;direction:ltr">`;
    const pt = a => [c + r * Math.cos(a * Math.PI / 180), c + r * Math.sin(a * Math.PI / 180)];
    parts.forEach(p => { const sweep = p.v / tot * 360, a1 = a0 + sweep - gapDeg; const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
      s += `<path d="M${x0},${y0} A${r},${r} 0 ${sweep - gapDeg > 180 ? 1 : 0} 1 ${x1},${y1}" fill="none" stroke="${p.color}" stroke-width="${thick}" stroke-linecap="butt"/>`; a0 += sweep; });
    s += `<text x="${c}" y="${c + 4}" text-anchor="middle" font-size="${size * .15}" font-weight="700" fill="#0F172A" font-family="${font}">${center}</text>`;
    s += `<text x="${c}" y="${c + size * .13}" text-anchor="middle" font-size="${size * .065}" fill="#64748B" font-family="${subFont}">${sub}</text>`;
    el.innerHTML = s + '</svg>';
  },
  ring(el, {size, thick, pct, color, track = '#EEF2F7', label = ''}) {
    const r = (size - thick) / 2, c = size / 2, L = 2 * Math.PI * r;
    el.innerHTML = `<svg width="${size}" height="${size}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${track}" stroke-width="${thick}"/><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${thick}" stroke-linecap="round" stroke-dasharray="${L * pct / 100} ${L}" transform="rotate(-90 ${c} ${c})"/><text x="${c}" y="${c + 4}" text-anchor="middle" font-size="${size * .24}" font-weight="700" font-family="Inter" fill="#0F172A">${label || pct + '%'}</text></svg>`;
  },
  spark(el, {w, h, data, color}) {
    const max = Math.max(...data), min = Math.min(...data), n = data.length;
    const pts = data.map((v, i) => [w - i * w / (n - 1), h - 3 - (v - min) / (max - min || 1) * (h - 6)]);
    el.innerHTML = `<svg width="${w}" height="${h}"><polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
};
