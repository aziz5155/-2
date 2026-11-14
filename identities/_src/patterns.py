# -*- coding: utf-8 -*-
"""Brand patterns as SVG, each derived from its symbol's geometry. Returns full <svg> of size w x h."""
import math


def rawasikh(w, h, c1, c2, bg=None, op=1.0, s=1.0):
    """Najdi frieze: strata bands alternating with rows of the triangular vent, as on Diriyah walls."""
    u = 36 * s                     # module
    out = [f'<rect width="{w}" height="{h}" fill="{bg}"/>'] if bg else []
    y, row = 0, 0
    while y < h + u:
        kind = row % 3
        if kind == 0:              # thick stratum
            out.append(f'<rect x="0" y="{y:.1f}" width="{w}" height="{u * .5:.1f}" fill="{c1}" opacity="{op}"/>')
            y += u * .5 + u * .22
        elif kind == 1:            # vent row (up triangles)
            n = int(w / u) + 2
            for i in range(n):
                x = i * u + (u / 2 if (row // 3) % 2 else 0)
                out.append(f'<path d="M{x:.1f},{y:.1f} L{x + u * .32:.1f},{y + u * .55:.1f} L{x - u * .32:.1f},{y + u * .55:.1f} Z" fill="{c2}" opacity="{op}"/>')
            y += u * .55 + u * .22
        else:                      # thin stratum
            out.append(f'<rect x="0" y="{y:.1f}" width="{w}" height="{u * .16:.1f}" fill="{c1}" opacity="{op}"/>')
            y += u * .16 + u * .5
        row += 1
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{"".join(out)}</svg>'


def madarij(w, h, c1, c2, bg=None, op=1.0, s=1.0):
    """Lattice of calligraphic rhombus dots; rising staircases (right to left) are picked out in accent."""
    r = 13 * s
    gx, gy = r * 2.15, r * 2.15
    out = [f'<rect width="{w}" height="{h}" fill="{bg}"/>'] if bg else []
    cols, rows = int(w / gx) + 2, int(h / gy) + 2
    for j in range(rows):
        for i in range(cols):
            cx = w - i * gx            # from the right edge
            cy = h - j * gy
            # staircase bands: a dot is "lit" when it sits on a rising diagonal band (periodic)
            band = (i - j) % 9
            col, o = c1, op * .16
            if band == 0:
                col, o = c2, op
            elif band in (1, 8):
                col, o = c1, op * .42
            out.append(f'<path d="M{cx:.1f},{cy - r:.1f} L{cx + r:.1f},{cy:.1f} L{cx:.1f},{cy + r:.1f} L{cx - r:.1f},{cy:.1f} Z" fill="{col}" opacity="{o:.2f}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{"".join(out)}</svg>'


def mirqab(w, h, c1, c2, bg=None, op=1.0, s=1.0, cx=None, cy=None):
    """Concentric lenses radiating from a focal star: lines of sight widening toward the horizon."""
    cx = w * .5 if cx is None else cx
    cy = h * .5 if cy is None else cy
    out = [f'<rect width="{w}" height="{h}" fill="{bg}"/>'] if bg else []
    n = 26
    for k in range(1, n):
        a = 40 * s * k ** 1.18          # half-width
        b = a * .34                      # half-height
        o = op * (0.95 - k / n * .75)
        out.append(f'<path d="M{cx - a:.1f},{cy:.1f} C{cx - a * .6:.1f},{cy - b * 1.33:.1f} {cx + a * .6:.1f},{cy - b * 1.33:.1f} {cx + a:.1f},{cy:.1f} '
                   f'C{cx + a * .6:.1f},{cy + b * 1.33:.1f} {cx - a * .6:.1f},{cy + b * 1.33:.1f} {cx - a:.1f},{cy:.1f} Z" fill="none" stroke="{c1}" stroke-width="{1.2 * s:.2f}" opacity="{o:.2f}"/>')
    R, k = 26 * s, 2.2 * s
    out.append(f'<path d="M{cx},{cy - R} Q{cx + k},{cy - k} {cx + R * .45},{cy} Q{cx + k},{cy + k} {cx},{cy + R} Q{cx - k},{cy + k} {cx - R * .45},{cy} Q{cx - k},{cy - k} {cx},{cy - R} Z" fill="{c2}" opacity="{op}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{"".join(out)}</svg>'


def mirqab_stars(w, h, c1, c2, bg=None, op=1.0, s=1.0):
    """Secondary repeat: a quiet field of guiding stars on a diagonal grid."""
    out = [f'<rect width="{w}" height="{h}" fill="{bg}"/>'] if bg else []
    g = 64 * s
    for j in range(int(h / g) + 2):
        for i in range(int(w / g) + 2):
            x = i * g + (g / 2 if j % 2 else 0); y = j * g
            big = (i * 7 + j * 3) % 11 == 0
            R = (11 if big else 5) * s; k = R * .14
            col = c2 if big else c1
            out.append(f'<path d="M{x},{y - R} Q{x + k},{y - k} {x + R * .5},{y} Q{x + k},{y + k} {x},{y + R} Q{x - k},{y + k} {x - R * .5},{y} Q{x - k},{y - k} {x},{y - R} Z" fill="{col}" opacity="{op if big else op * .45}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{"".join(out)}</svg>'


PATTERNS = {'rawasikh': rawasikh, 'madarij': madarij, 'mirqab': mirqab}
