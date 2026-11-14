# -*- coding: utf-8 -*-
"""The three symbols, drawn on a 100x100 grid. Each returns SVG markup (no outer <svg>)."""


def rawasikh(c1, c2=None):
    """Najdi tapered wall in three strata; a triangular vent pierces the top stratum."""
    c2 = c2 or c1
    L = lambda y: 14 + (92 - y) * 12 / 80      # left edge at height y (wall tapers upward)
    R = lambda y: 100 - L(y)
    def layer(y0, y1):
        return f'M{L(y0):.2f},{y0} L{R(y0):.2f},{y0} L{R(y1):.2f},{y1} L{L(y1):.2f},{y1} Z'
    vent = 'M50,15.5 L57.5,28.5 L42.5,28.5 Z'
    return (f'<path fill="{c1}" fill-rule="evenodd" d="{layer(12, 33)} {vent}"/>'
            f'<path fill="{c1}" d="{layer(39, 61)}"/>'
            f'<path fill="{c2}" d="{layer(67, 92)}"/>')


def madarij(c1, c2):
    """Steps built from calligraphic rhombus dots (the qalam measuring unit), rising right-to-left."""
    w, h = 12.5, 12.5
    def rh(cx, cy, col):
        return f'<path fill="{col}" d="M{cx},{cy - h} L{cx + w},{cy} L{cx},{cy + h} L{cx - w},{cy} Z"/>'
    out = []
    cols = [(77, 1), (50, 2), (23, 3)]          # right -> left, growing
    base = 88
    for cx, n in cols:
        for k in range(n):
            cy = base - h - k * 2 * h - k * 1.6
            top = (cx == 23 and k == n - 1)
            out.append(rh(cx, cy, c2 if top else c1))
    return ''.join(out)


def mirqab(c1, c2):
    """A lens-shaped eye holding a four-point guiding star (Suhail). The star's vertical
    arms pierce the frame: foresight that sees beyond the horizon."""
    outer = 'M4,50 C22,22 78,22 96,50 C78,78 22,78 4,50 Z'
    inner = 'M19,50 C34,32.5 66,32.5 81,50 C66,67.5 34,67.5 19,50 Z'
    k = 3.6   # how far the curve control points sit from the centre (star waist)
    star = (f'M50,8 Q{50 + k},{50 - k} 68,50 Q{50 + k},{50 + k} 50,92 '
            f'Q{50 - k},{50 + k} 32,50 Q{50 - k},{50 - k} 50,8 Z')
    # thin gap around the star where it crosses the eye ring
    gap = (f'M50,3 Q{50 + k + 2.6},{50 - k - 1.5} 73,50 Q{50 + k + 2.6},{50 + k + 1.5} 50,97 '
           f'Q{50 - k - 2.6},{50 + k + 1.5} 27,50 Q{50 - k - 2.6},{50 - k - 1.5} 50,3 Z')
    return (f'<defs><mask id="mq{c1[1:]}"><rect width="100" height="100" fill="#fff"/><path d="{gap}" fill="#000"/></mask></defs>'
            f'<path fill="{c1}" fill-rule="evenodd" mask="url(#mq{c1[1:]})" d="{outer} {inner}"/>'
            f'<path fill="{c2}" d="{star}"/>')


if __name__ == '__main__':
    import sys
    cells = [rawasikh('#1E2A2F', '#B07A4F'), madarij('#0B4D3B', '#9BD34A'), mirqab('#10142E', '#F2A541')]
    html = '<body style="margin:0;background:#fff;display:flex;gap:40px;padding:40px">' + ''.join(
        f'<div style="display:flex;flex-direction:column;gap:20px;align-items:center"><svg width="300" height="300" viewBox="0 0 100 100" style="background:#F4F2EE">{c}</svg>'
        f'<div style="display:flex;gap:16px;align-items:end"><svg width="64" height="64" viewBox="0 0 100 100">{c}</svg><svg width="32" height="32" viewBox="0 0 100 100">{c}</svg><svg width="16" height="16" viewBox="0 0 100 100">{c}</svg></div></div>'
        for c in cells) + '</body>'
    open(sys.argv[1], 'w').write(html)
