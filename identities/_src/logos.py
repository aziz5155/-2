# -*- coding: utf-8 -*-
"""Builds vector logo lockups (horizontal, vertical, symbol) for each brand as standalone SVG."""
import os, re
from shape import text_path, bbox
from brands import BRANDS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..')


def palette(b, mode):
    if mode == 'color':
        return b['primary'], b['secondary'], b['primary'], b['primary']
    if mode == 'reverse':
        return '#FFFFFF', b['secondary'], '#FFFFFF', '#FFFFFF'
    return b['ink'], b['ink'], b['ink'], b['ink']          # mono


def _text(b, which, size):
    f, w = (b['font'], b['wght']) if which == 'name' else (b['tag_font'], b['tag_wght'])
    t = b['name'] if which == 'name' else b['tagline']
    d, adv, *_ = text_path(t, f, size, w)
    x0, y0, x1, y1 = bbox(t, f, size, w)
    return d, x0, y0, x1, y1


def _subpaths(d):
    parts = ['M' + x for x in d.split('M') if x.strip()]
    out = []
    for sp in parts:
        nums = [float(n) for n in re.findall(r'-?\d+\.?\d*', sp)]
        xs, ys = nums[0::2], nums[1::2]
        out.append((sp, min(xs), min(ys), max(xs), max(ys)))
    return out


def motif(kind, cx, cy, r):
    """Brand motif replacing a letter dot (r ~ half the original dot size)."""
    if kind == 'triangle':
        r *= 1.7
        return f'M{cx:.2f},{cy - r:.2f} L{cx + r * 1.08:.2f},{cy + r * .8:.2f} L{cx - r * 1.08:.2f},{cy + r * .8:.2f} Z'
    if kind == 'rhombus':
        r *= 1.6
        return f'M{cx:.2f},{cy - r:.2f} L{cx + r:.2f},{cy:.2f} L{cx:.2f},{cy + r:.2f} L{cx - r:.2f},{cy:.2f} Z'
    if kind == 'star':
        R, k = r * 2.9, r * .42
        return (f'M{cx:.2f},{cy - R:.2f} Q{cx + k:.2f},{cy - k:.2f} {cx + R * .62:.2f},{cy:.2f} Q{cx + k:.2f},{cy + k:.2f} {cx:.2f},{cy + R:.2f} '
                f'Q{cx - k:.2f},{cy + k:.2f} {cx - R * .62:.2f},{cy:.2f} Q{cx - k:.2f},{cy - k:.2f} {cx:.2f},{cy - R:.2f} Z')


def split_name(b, d):
    """Separate the chosen letter dot from the name outline; return (rest_d, motif_d)."""
    sps = _subpaths(d)
    W = max(s[3] for s in sps) - min(s[1] for s in sps)
    small = [s for s in sps if (s[3] - s[1]) < W * 0.09 and (s[4] - s[2]) < W * 0.09]
    pick = b['dot']
    if pick == 'lowest':
        t = max(small, key=lambda s: s[4])
    else:                              # 'top'
        t = min(small, key=lambda s: s[2])
    rest = ' '.join(s[0] for s in sps if s is not t)
    cx, cy = (t[1] + t[3]) / 2, (t[2] + t[4]) / 2
    r = max(t[3] - t[1], t[4] - t[2]) / 2
    return rest, motif(b['motif'], cx, cy, r)


def text_block(b, name_h=50.0):
    """Name + tagline, both right-aligned at x=0 (RTL), name ink top at y=0. Returns (svg_fn, width, height)."""
    _, x0, y0, x1, y1 = _text(b, 'name', 100)
    ns = 100 * name_h / (y1 - y0)                      # size so the name's ink height = name_h
    nd, nx0, ny0, nx1, ny1 = _text(b, 'name', ns)
    nw = nx1 - nx0
    _, tx0, ty0, tx1, ty1 = _text(b, 'tagline', 100)
    ts = 100 * nw / (tx1 - tx0)                        # tagline spans the name's width ...
    ts = max(min(ts, name_h * 0.36), name_h * 0.29)    # ... within readable limits
    td, tx0, ty0, tx1, ty1 = _text(b, 'tagline', ts)
    gap = name_h * 0.34
    w = max(nw, tx1 - tx0)
    h = (ny1 - ny0) + gap + (ty1 - ty0)

    rest, mot = split_name(b, nd)

    def svg(color, x_right, y_top, align='right', accent=None):
        def place(d, ix0, iy0, iw, y, col):
            if align == 'right':
                tx = x_right - (ix0 + iw)
            else:                                       # centre on x_right
                tx = x_right - iw / 2 - ix0
            return f'<path fill="{col}" transform="translate({tx:.2f},{y - iy0:.2f})" d="{d}"/>'
        return (place(rest, nx0, ny0, nw, y_top, color) + place(mot, nx0, ny0, nw, y_top, accent or color) +
                place(td, tx0, ty0, tx1 - tx0, y_top + (ny1 - ny0) + gap, color))
    return svg, w, h


def horizontal(b, mode='color'):
    c1, c2, ct, _ = palette(b, mode)
    S = 100
    svg, w, h = text_block(b, name_h=52)
    gap = 30
    W = w + gap + S
    y_text = (S - h) / 2
    body = (f'<g transform="translate({W - S},0)">{b["sym"](c1, c2)}</g>' + svg(ct, W - S - gap, y_text, accent=c2 if mode != 'mono' else None))
    return wrap(body, W, S, pad=0)


def vertical(b, mode='color'):
    c1, c2, ct, _ = palette(b, mode)
    S = 100
    svg, w, h = text_block(b, name_h=40)
    W = max(w, S)
    body = (f'<g transform="translate({(W - S) / 2},0)">{b["sym"](c1, c2)}</g>' + svg(ct, W / 2, S + 26, align='center', accent=c2 if mode != 'mono' else None))
    return wrap(body, W, S + 26 + h, pad=0)


def wordmark(b, mode='color'):
    c1, c2, ct, _ = palette(b, mode)
    svg, w, h = text_block(b, name_h=52)
    return wrap(svg(ct, w, 0, accent=c2 if mode != 'mono' else None), w, h)


def symbol(b, mode='color'):
    c1, c2, *_ = palette(b, mode)
    return wrap(b['sym'](c1, c2), 100, 100, pad=0)


def wrap(body, w, h, pad=0):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad:.2f} {-pad:.2f} {w + 2 * pad:.2f} {h + 2 * pad:.2f}" '
            f'width="{w + 2 * pad:.2f}" height="{h + 2 * pad:.2f}">{body}</svg>')


def build():
    files = {}
    for b in BRANDS:
        d = os.path.join(OUT, b['folder'], 'logo', 'svg')
        os.makedirs(d, exist_ok=True)
        for mode in ('color', 'reverse', 'mono'):
            for kind, fn in (('horizontal', horizontal), ('vertical', vertical), ('symbol', symbol), ('wordmark', wordmark)):
                p = os.path.join(d, f'{b["key"]}-{kind}-{mode}.svg')
                open(p, 'w').write(fn(b, mode))
                files[(b['key'], kind, mode)] = p
    return files


if __name__ == '__main__':
    print(len(build()), 'svg files')
