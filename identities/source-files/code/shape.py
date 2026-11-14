# -*- coding: utf-8 -*-
"""Arabic text -> SVG path outlines (HarfBuzz shaping), so logo SVGs need no fonts."""
import os
import uharfbuzz as hb

HERE = os.path.dirname(os.path.abspath(__file__))
_cache = {}


def _font(name, wght=None):
    key = (name, wght)
    if key not in _cache:
        blob = hb.Blob.from_file_path(os.path.join(HERE, 'ttf', name))
        face = hb.Face(blob)
        font = hb.Font(face)
        if wght is not None:
            font.set_variations({'wght': wght})
        _cache[key] = (font, face.upem)
    return _cache[key]


class _Pen:
    def __init__(self, s, ox, oy):
        self.d, self.s, self.ox, self.oy = [], s, ox, oy

    def p(self, x, y):
        return f'{self.ox + x * self.s:.2f},{self.oy - y * self.s:.2f}'

    def moveTo(self, p): self.d.append('M' + self.p(*p))
    def lineTo(self, p): self.d.append('L' + self.p(*p))
    def qCurveTo(self, *pts):
        # TrueType quadratic spline with possible implied on-curve points
        pts = list(pts)
        while len(pts) > 2:
            a, b = pts[0], pts[1]
            mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            self.d.append('Q' + self.p(*a) + ' ' + self.p(*mid)); pts = pts[1:]
        self.d.append('Q' + self.p(*pts[0]) + ' ' + self.p(*pts[1]))
    def curveTo(self, a, b, c): self.d.append('C' + self.p(*a) + ' ' + self.p(*b) + ' ' + self.p(*c))
    def closePath(self): self.d.append('Z')
    def endPath(self): pass


def text_path(text, font, size, wght=None, tracking=0, features=None):
    """Return (d, width, ascent, descent) for text set at `size` px with baseline at y=0, starting x=0.
    tracking: extra px between glyph clusters (use 0 for connected Arabic)."""
    f, upem = _font(font, wght)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(f, buf, features or {'kern': True, 'liga': True})
    s = size / upem
    x = 0
    ds = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = _Pen(s, x + pos.x_offset * s, -pos.y_offset * s)
        f.draw_glyph_with_pen(info.codepoint, pen)
        ds.extend(pen.d)
        x += pos.x_advance * s + tracking
    ext = f.get_font_extents('ltr')
    return ' '.join(ds), x - tracking, ext.ascender * s, -ext.descender * s


def bbox(text, font, size, wght=None):
    """Tight ink bbox (minx, miny, maxx, maxy) in the same coords as text_path (y down)."""
    f, upem = _font(font, wght)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties(); hb.shape(f, buf, {})
    s = size / upem; x = 0; xs = []; ys = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        e = f.get_glyph_extents(info.codepoint)
        if e and e.width:
            gx = x + pos.x_offset * s
            xs += [gx + e.x_bearing * s, gx + (e.x_bearing + e.width) * s]
            ys += [-(e.y_bearing + pos.y_offset) * s, -(e.y_bearing + e.height + pos.y_offset) * s]
        x += pos.x_advance * s
    return min(xs), min(ys), max(xs), max(ys)


if __name__ == '__main__':
    d, w, a, de = text_path('رواسخ', 'NotoKufiArabic[wght].ttf', 100, 700)
    print(w, a, de, bbox('رواسخ', 'NotoKufiArabic[wght].ttf', 100, 700), d[:120])
