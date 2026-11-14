# -*- coding: utf-8 -*-
"""Generates one HTML per brand: a sequence of 1920x1080 slides (identity book + mockups)."""
import os, re
from brands import BRANDS
import logos
from patterns import PATTERNS, mirqab_stars

HERE = os.path.dirname(os.path.abspath(__file__))


def emb(svg, h=None, w=None, extra=''):
    """Inline an SVG at a given CSS height or width."""
    svg = re.sub(r' width="[\d.]+" height="[\d.]+"', '', svg, count=1)
    st = (f'height:{h}px;width:auto;' if h else '') + (f'width:{w}px;height:auto;' if w else '')
    return svg.replace('<svg ', f'<svg style="display:block;{st}{extra}" ', 1)


def outline(svg_body, col, sw):
    return re.sub(r'fill="#[0-9A-Fa-f]{6}"', f'fill="none" stroke="{col}" stroke-width="{sw}"', svg_body)


def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lum(h):
    r, g, b = [x / 255 for x in hexrgb(h)]
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)


CSS = """
@page{size:1920px 1080px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;background:#fff}
body{font-family:var(--body),sans-serif;color:var(--ink);direction:rtl;-webkit-font-smoothing:antialiased}
.slide{width:1920px;height:1080px;position:relative;overflow:hidden;page-break-after:always;background:#fff}
.slide:last-child{page-break-after:auto}
.disp{font-family:var(--disp),sans-serif}
.lat{font-family:'IBM Plex Sans Arabic',sans-serif;direction:ltr;unicode-bidi:isolate}
.meta{position:absolute;top:64px;right:110px;left:110px;display:flex;justify-content:space-between;align-items:center;font-size:17px;color:#8A8F93;letter-spacing:.2px;z-index:5}
.meta b{color:var(--ink);font-weight:600}
.meta .n{font-family:'IBM Plex Sans Arabic';direction:ltr}
.foot{position:absolute;bottom:56px;right:110px;left:110px;display:flex;justify-content:space-between;font-size:15px;color:#9A9FA3;z-index:5}
.dark .meta,.dark .foot{color:rgba(255,255,255,.55)}.dark .meta b{color:#fff}
.k{font-size:18px;color:var(--p);font-weight:600;letter-spacing:.3px;display:flex;align-items:center;gap:12px}
.k::before{content:'';width:34px;height:2px;background:var(--s)}
h1.t{font-family:var(--disp);font-size:64px;font-weight:700;line-height:1.25;margin-top:20px;color:var(--ink)}
p.lead{font-size:24px;line-height:1.95;color:#4A5156;margin-top:26px}
.grain{position:absolute;inset:0;background:url(noise.png);opacity:.55;mix-blend-mode:multiply;pointer-events:none}
.shadow{box-shadow:0 1px 1px rgba(0,0,0,.06),0 6px 12px rgba(0,0,0,.08),0 22px 44px rgba(0,0,0,.14),0 50px 90px rgba(0,0,0,.12)}
.sw-name{font-size:26px;font-weight:600;font-family:var(--disp)}
"""


def page(b, idx, total, title, body, cls='', bg='#fff'):
    return (f'<section class="slide {cls}" style="background:{bg}">'
            f'<div class="meta"><span><b>{b["name"]}</b> — {b["tagline"]}</span><span>{title}</span></div>'
            f'{body}<div class="foot"><span>هوية بصرية {b["num"]} · {b["theme"]}</span><span class="n" dir="ltr">{idx:02d} / {total:02d}</span></div></section>')


# ------------------------------------------------------------------ slides
def s_cover(b):
    pat = PATTERNS[b['key']](1920, 1080, '#FFFFFF', b['secondary'], op=.045, s=1.6)
    if b['key'] == 'madarij':
        pat = PATTERNS['madarij'](1920, 1080, '#FFFFFF', b['secondary'], op=.32, s=1.7)
    if b['key'] == 'mirqab':
        pat = PATTERNS['mirqab'](1920, 1080, '#FFFFFF', b['secondary'], op=.5, s=1.9, cx=560, cy=540)
    logo = emb(logos.vertical(b, 'reverse'), h=430)
    return (f'<section class="slide dark" style="background:{b["primary"]}">'
            f'<div style="position:absolute;inset:0;opacity:.9">{pat}</div>'
            f'<div style="position:absolute;inset:0;background:radial-gradient(1100px 900px at 72% 50%,{b["primary"]} 35%,transparent 80%),linear-gradient(0deg,{b["primary"]} 0%,transparent 45%)"></div>'
            f'<div style="position:absolute;right:250px;top:50%;transform:translateY(-50%)">{logo}</div>'
            f'<div style="position:absolute;left:150px;bottom:150px;color:#fff;text-align:left;direction:ltr">'
            f'<div class="lat" style="font-size:20px;letter-spacing:6px;opacity:.6">BRAND IDENTITY {b["num"]}</div>'
            f'<div style="font-family:var(--disp);direction:rtl;font-size:44px;font-weight:700;margin-top:12px">{b["theme"]}</div>'
            f'<div style="direction:rtl;font-size:19px;opacity:.6;margin-top:10px">هوية بصرية لشركة استشارات افتراضية — عمل استعراضي</div></div>'
            f'<div style="position:absolute;top:64px;right:110px;left:110px;display:flex;justify-content:space-between;color:rgba(255,255,255,.55);font-size:17px"><span>{b["en"]} — {b["en_tag"].title()}</span><span class="lat">2026</span></div>'
            f'</section>')


def s_brief(b, i, T):
    sec, aud, city = b['persona']
    body = f'''
<div style="position:absolute;right:110px;top:220px;width:820px">
 <div class="k">عن الشركة</div>
 <h1 class="t">{b["name"]} {b["tagline"]}</h1>
 <p class="lead">شركة سعودية افتراضية تعمل في مجال {sec}، وتخدم {aud}. بُنيت هويتها حول قيمة واحدة واضحة: <b style="color:var(--ink)">{b["theme"]}</b>، لتكون كل نقطة تواصل مع العميل امتدادًا لهذه القيمة.</p>
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:60px;border-top:1px solid #E4E2DD">
  {''.join(f'<div style="padding:28px 0 0 24px"><div style="font-size:16px;color:#9A9FA3">{l}</div><div style="font-size:23px;font-weight:600;margin-top:8px;line-height:1.5">{v}</div></div>' for l, v in [("المجال", sec), ("الفئة المستهدفة", aud), ("المقر", city)])}
 </div>
</div>
<div style="position:absolute;left:110px;top:200px;width:700px;height:700px;background:var(--l);display:grid;place-items:center">
 <div style="text-align:center">
  {''.join(f'<div style="padding:26px 0;border-bottom:1px solid rgba(0,0,0,.08);width:470px"><div class="disp" style="font-size:30px;font-weight:700;color:var(--p)">{t}</div><div style="font-size:19px;color:#6A7176;margin-top:6px">{d}</div></div>' for t, d in b["pillars"])}
 </div>
</div>'''
    return page(b, i, T, 'الموجز والقيم', body)


def s_concept(b, i, T):
    sym = emb(logos.symbol(b, 'color'), h=520)
    body = f'''
<div style="position:absolute;right:110px;top:220px;width:760px">
 <div class="k">فكرة الشعار</div>
 <h1 class="t">{b["idea_title"]}</h1>
 <p class="lead" style="font-size:22.5px">{b["idea"]}</p>
 <p style="font-size:19px;line-height:1.9;color:#6A7176;margin-top:26px;padding-right:22px;border-right:3px solid var(--s)">{b["saudi"]}</p>
</div>
<div style="position:absolute;left:110px;top:170px;width:820px;height:760px;display:grid;place-items:center;background:var(--l)">
 <div style="position:relative">{sym}</div>
</div>'''
    return page(b, i, T, 'الفكرة والمعنى', body)


def s_construction(b, i, T):
    g = ''.join(f'<line x1="{x}" y1="-4" x2="{x}" y2="104" stroke="#C9CDD2" stroke-width=".18"/>' for x in range(0, 101, 5))
    g += ''.join(f'<line x1="-4" y1="{y}" x2="104" y2="{y}" stroke="#C9CDD2" stroke-width=".18"/>' for y in range(0, 101, 5))
    g += '<rect x="0" y="0" width="100" height="100" fill="none" stroke="#9AA0A6" stroke-width=".3"/>'
    extra = {
        'rawasikh': '<line x1="14" y1="92" x2="26" y2="12" stroke="#E0533D" stroke-width=".35" stroke-dasharray="1.2 1"/><line x1="86" y1="92" x2="74" y2="12" stroke="#E0533D" stroke-width=".35" stroke-dasharray="1.2 1"/>'
                    '<text x="88" y="56" font-size="2.6" fill="#E0533D" font-family="IBM Plex Sans Arabic">ميل 8.5°</text>',
        'madarij': ''.join(f'<line x1="{x}" y1="0" x2="{x}" y2="100" stroke="#E0533D" stroke-width=".3" stroke-dasharray="1.2 1"/>' for x in (23, 50, 77)) +
                   '<line x1="0" y1="88" x2="100" y2="88" stroke="#E0533D" stroke-width=".35"/>',
        'mirqab': '<circle cx="50" cy="50" r="46" fill="none" stroke="#E0533D" stroke-width=".3" stroke-dasharray="1.2 1"/><line x1="0" y1="50" x2="100" y2="50" stroke="#E0533D" stroke-width=".3"/><line x1="50" y1="0" x2="50" y2="100" stroke="#E0533D" stroke-width=".3"/>',
    }[b['key']]
    body_sym = b['sym'](b['primary'], b['secondary'])
    drawing = (f'<svg viewBox="-6 -6 112 112" style="width:720px;height:720px;display:block">{g}'
               f'<g opacity=".14">{body_sym}</g>{outline(body_sym, b["primary"], .45)}{extra}</svg>')
    notes = {
        'rawasikh': [('شبكة 20 × 20', 'كل الأبعاد مضاعفات لوحدة واحدة.'), ('ميل ثابت', 'الحافتان تميلان بالزاوية نفسها، كجدار طيني مستدق.'), ('فواصل متساوية', 'الطبقات الثلاث تفصلها مسافات متطابقة.')],
        'madarij': [('النقطة وحدة القياس', 'كل عنصر معيّن مطابق للآخر تمامًا.'), ('ثلاثة أعمدة', 'ارتفاعاتها 1 ثم 2 ثم 3 نقاط.'), ('قاعدة واحدة', 'كل الدرجات تقف على خط أساس مشترك.')],
        'mirqab': [('محوران متعامدان', 'العين والنجم متمركزان على المحورين نفسيهما.'), ('عدسة متناظرة', 'قوسان متطابقان يرسمان إطار العين.'), ('فاصل بصري', 'مسافة دقيقة تفصل النجم عن الإطار ليبقى واضحًا.')],
    }[b['key']]
    body = f'''
<div style="position:absolute;right:110px;top:220px;width:560px">
 <div class="k">بناء الرمز</div>
 <h1 class="t">هندسة دقيقة<br>ووضوح عند التصغير</h1>
 <div style="margin-top:44px">{''.join(f'<div style="padding:22px 0;border-top:1px solid #E6E4DF"><div style="font-size:23px;font-weight:600">{t}</div><div style="font-size:19px;color:#6A7176;margin-top:6px">{d}</div></div>' for t, d in notes)}</div>
</div>
<div style="position:absolute;left:150px;top:180px">{drawing}</div>'''
    return page(b, i, T, 'البناء الهندسي', body)


def s_primary(b, i, T):
    body = f'''
<div style="position:absolute;inset:0;display:grid;place-items:center">{emb(logos.horizontal(b, 'color'), h=260)}</div>
<div style="position:absolute;right:110px;bottom:120px;font-size:19px;color:#8A8F93">الشعار الأفقي — النسخة الرئيسية</div>'''
    return page(b, i, T, 'الشعار الرئيسي', body)


def s_lockups(b, i, T):
    body = f'''
<div style="position:absolute;right:110px;top:170px;left:110px;bottom:130px;display:grid;grid-template-columns:1.25fr 1fr;grid-template-rows:1fr 1fr;gap:28px">
 <div style="grid-row:span 2;background:var(--l);display:grid;place-items:center;position:relative">{emb(logos.vertical(b, 'color'), h=470)}<span style="position:absolute;bottom:26px;right:30px;font-size:17px;color:#8A8F93">النسخة الرأسية</span></div>
 <div style="background:{b['primary']};display:grid;place-items:center;position:relative">{emb(logos.horizontal(b, 'reverse'), h=130)}<span style="position:absolute;bottom:22px;right:28px;font-size:16px;color:rgba(255,255,255,.55)">النسخة المعكوسة</span></div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
  <div style="border:1px solid #E6E4DF;display:grid;place-items:center;position:relative">{emb(logos.horizontal(b, 'mono'), w=330)}<span style="position:absolute;bottom:22px;right:28px;font-size:16px;color:#8A8F93">أحادية اللون</span></div>
  <div style="background:{b['secondary']};display:grid;place-items:center;position:relative">{emb(logos.symbol(b, 'mono').replace(b['ink'], '#FFFFFF' if lum(b['secondary']) < .45 else b['ink']), h=150)}<span style="position:absolute;bottom:22px;right:28px;font-size:16px;color:{'rgba(255,255,255,.7)' if lum(b['secondary']) < .45 else 'rgba(0,0,0,.5)'}">الرمز على اللون الثانوي</span></div>
 </div>
</div>'''
    return page(b, i, T, 'نسخ الشعار', body)


def s_icon(b, i, T):
    sym_w = logos.symbol(b, 'reverse'); sym_c = logos.symbol(b, 'color')
    tile = lambda sz, r, inner: f'<div style="width:{sz}px;height:{sz}px;border-radius:{r}px;background:{b["primary"]};display:grid;place-items:center;box-shadow:0 10px 30px rgba(0,0,0,.15)">{emb(sym_w, h=inner)}</div>'
    body = f'''
<div style="position:absolute;right:110px;top:220px;width:560px">
 <div class="k">الرمز كأيقونة</div>
 <h1 class="t">واضح في كل مقاس</h1>
 <p class="lead">صُمم الرمز ليعمل مستقلًا أيقونةً للتطبيقات والمواقع ووسائل التواصل، ويحافظ على وضوحه حتى مقاس 16 بكسل.</p>
 <div style="margin-top:46px;font-size:18px;color:#6A7176;line-height:2.1">
  <div>أصغر مقاس مطبوع للرمز: <b style="color:var(--ink)">8 مم</b></div>
  <div>أصغر مقاس رقمي للرمز: <b style="color:var(--ink)">16 بكسل</b></div>
  <div>المساحة الآمنة حول الشعار: <b style="color:var(--ink)">ربع عرض الرمز من كل جهة</b></div>
 </div>
</div>
<div style="position:absolute;left:110px;top:180px;width:960px;height:760px;background:var(--l);padding:70px;display:flex;flex-direction:column;justify-content:space-between">
 <div style="display:flex;align-items:flex-end;gap:46px;justify-content:center">{tile(260, 58, 150)}{tile(150, 34, 88)}{tile(96, 22, 56)}</div>
 <div style="display:flex;align-items:flex-end;gap:50px;justify-content:center;padding-top:40px;border-top:1px solid rgba(0,0,0,.08)">
  {''.join(f'<div style="text-align:center">{emb(sym_c, h=s)}<div class="lat" style="font-size:14px;color:#9A9FA3;margin-top:14px">{s}px</div></div>' for s in (128, 64, 48, 32, 24, 16))}
 </div>
</div>'''
    return page(b, i, T, 'الأيقونة', body)


def s_colors(b, i, T):
    cs = b['colors']
    def sw(c, big=False):
        h, n, role = c
        r, g, bb = hexrgb(h)
        txt = '#fff' if lum(h) < .4 else b['ink']
        border = 'border:1px solid #E6E4DF;' if lum(h) > .85 else ''
        return (f'<div style="background:{h};{border}color:{txt};padding:34px 32px;display:flex;flex-direction:column;justify-content:space-between">'
                f'<div><div class="sw-name" style="font-size:{30 if big else 23}px">{n}</div><div style="font-size:16px;opacity:.75;margin-top:4px">{role}</div></div>'
                f'<div class="lat" style="font-size:{19 if big else 16}px;line-height:1.7;text-align:right"><b>{h.upper()}</b><br><span style="opacity:.75">RGB {r} {g} {bb}</span></div></div>')
    body = f'''
<div style="position:absolute;right:110px;top:170px;left:110px;bottom:130px;display:grid;grid-template-columns:1.4fr 1.4fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:20px">
 <div style="grid-row:span 2;display:grid">{sw(cs[0], True)}</div>
 <div style="grid-row:span 2;display:grid">{sw(cs[1], True)}</div>
 {''.join(f'<div style="display:grid">{sw(c)}</div>' for c in cs[2:])}
</div>'''
    return page(b, i, T, 'لوحة الألوان', body)


def s_type(b, i, T):
    (f1, r1, d1), (f2, r2, d2) = b['fonts']
    fam2 = f2.replace(' Light', '')
    w2 = 300 if 'Light' in f2 else 400
    body = f'''
<div style="position:absolute;right:110px;top:170px;left:110px;bottom:130px;display:grid;grid-template-columns:1.25fr 1fr;gap:28px">
 <div style="background:var(--l);padding:70px 70px;display:flex;flex-direction:column;justify-content:space-between">
  <div><div style="font-size:18px;color:#8A8F93">{r1}</div><div class="lat" style="font-size:30px;font-weight:600;margin-top:6px;text-align:right">{f1}</div></div>
  <div style="font-family:'{f1}';font-size:220px;font-weight:700;line-height:1;color:var(--p)">أب ج</div>
  <div style="font-family:'{f1}';font-size:30px;font-weight:700;line-height:1.6">ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن هـ و ي<br><span class="lat" style="font-family:'{f1}';font-weight:500;font-size:26px;color:#6A7176">0123456789</span></div>
  <div style="font-size:19px;color:#6A7176;line-height:1.8">{d1}</div>
 </div>
 <div style="border:1px solid #E6E4DF;padding:70px 60px;display:flex;flex-direction:column;gap:28px">
  <div><div style="font-size:18px;color:#8A8F93">{r2}</div><div class="lat" style="font-size:30px;font-weight:600;margin-top:6px;text-align:right">{f2}</div></div>
  <div style="font-family:'{fam2}';font-weight:{w2};border-top:1px solid #EEE;padding-top:26px">
   <div style="font-size:46px;font-weight:{700 if w2 == 400 else 300};line-height:1.35;font-family:'{f1 if w2 == 400 else fam2}'">عنوان رئيسي واضح</div>
   <div style="font-size:28px;font-weight:600;margin-top:16px;color:var(--p)">عنوان فرعي للأقسام</div>
   <p style="font-size:20px;line-height:1.95;color:#4A5156;margin-top:16px;font-family:'{fam2}';font-weight:400">نص أساسي للتقارير والعروض والمراسلات، بقراءة مريحة ومسافات متوازنة بين الأسطر تضمن الوضوح في المطبوعات والشاشات.</p>
  </div>
  <div style="margin-top:auto;font-size:19px;color:#6A7176;line-height:1.8">{d2}</div>
 </div>
</div>'''
    return page(b, i, T, 'الخطوط', body)


def s_pattern(b, i, T):
    k = b['key']
    if k == 'rawasikh':
        pat = PATTERNS[k](1100, 760, b['primary'], b['secondary'], bg=b['light'], s=1.3)
    elif k == 'madarij':
        pat = PATTERNS[k](1100, 760, b['primary'], b['secondary'], bg=b['light'], s=1.25)
    else:
        pat = PATTERNS[k](1100, 760, '#FFFFFF', b['secondary'], bg=b['primary'], s=1.35, cx=550, cy=380)
    desc = {
        'rawasikh': 'إفريز نجدي متكرر: أشرطة أفقية تمثل طبقات الجدار، يتخللها صف من المثلثات المأخوذة من فتحة الرمز. يُستخدم في الأغلفة والفواصل وخلفيات العروض.',
        'madarij': 'شبكة من النقاط المعيّنة تتخللها درجات صاعدة من اليمين إلى اليسار بلون البرعم، فيتحول الرمز إلى نسيج بصري يعبّر عن النمو المستمر.',
        'mirqab': 'عدسات متتالية تتسع من نجم مركزي كأنها خطوط النظر الممتدة نحو الأفق، ويرافقها نمط ثانوي هادئ من النجوم الصغيرة.',
    }[k]
    body = f'''
<div style="position:absolute;right:110px;top:220px;width:520px">
 <div class="k">النمط البصري</div>
 <h1 class="t">نسيج مشتق<br>من الرمز نفسه</h1>
 <p class="lead">{desc}</p>
</div>
<div style="position:absolute;left:110px;top:170px;width:1100px;height:760px;overflow:hidden">{pat}</div>'''
    return page(b, i, T, 'النمط البصري', body)


# ------------------------------------------------------------------ mockups
def surface(b, tone):
    return (f'background:radial-gradient(1400px 900px at 40% 30%,{tone[0]},{tone[1]} 70%);')


TONES = {'rawasikh': ('#E9E3D8', '#CFC6B6'), 'madarij': ('#ECEDE6', '#D3D6CB'), 'mirqab': ('#2A2F4A', '#14182E')}


def card_front(b, w, h):
    k = b['key']
    if k == 'rawasikh':
        bg = b['primary']
        inner = f'<div style="position:absolute;inset:0;opacity:.07">{PATTERNS[k](w, h, "#fff", "#fff", s=.9)}</div><div style="position:absolute;inset:0;display:grid;place-items:center">{emb(logos.vertical(b, "reverse"), h=h * .55)}</div>'
    elif k == 'madarij':
        bg = b['primary']
        inner = f'<div style="position:absolute;left:0;top:0;bottom:0;width:{w * .42}px;overflow:hidden;opacity:.9">{PATTERNS[k](int(w * .42), h, "#fff", b["secondary"], op=.35, s=.62)}</div><div style="position:absolute;right:{w * .1}px;top:50%;transform:translateY(-50%)">{emb(logos.symbol(b, "reverse"), h=h * .42)}</div>'
    else:
        bg = b['primary']
        inner = f'<div style="position:absolute;inset:0">{PATTERNS[k](w, h, "#fff", b["secondary"], op=.35, s=.55, cx=w / 2, cy=h / 2)}</div><div style="position:absolute;inset:0;display:grid;place-items:center">{emb(logos.symbol(b, "reverse"), h=h * .4)}</div>'
    return f'<div style="width:{w}px;height:{h}px;background:{bg};position:relative;overflow:hidden;border-radius:6px">{inner}<div class="grain" style="opacity:.35"></div></div>'


def card_back(b, w, h):
    person, role = b['person']
    s = w / 680
    return f'''<div style="width:{w}px;height:{h}px;background:#FFFFFF;position:relative;overflow:hidden;border-radius:6px;padding:{56 * s}px {58 * s}px">
 <div style="position:absolute;top:{50 * s}px;left:{56 * s}px">{emb(logos.horizontal(b, 'color'), h=62 * s)}</div>
 <div style="position:absolute;right:{58 * s}px;top:{170 * s}px">
  <div class="disp" style="font-size:{31 * s}px;font-weight:700;color:{b['ink']}">{person}</div>
  <div style="font-size:{19 * s}px;color:{b['secondary'] if b['key'] != 'madarij' else b['primary']};margin-top:{4 * s}px;font-weight:600">{role}</div>
 </div>
 <div style="position:absolute;right:{58 * s}px;bottom:{50 * s}px;font-size:{16.5 * s}px;line-height:1.9;color:#4A5156">
  <div class="lat" style="text-align:right">{b['phone']}</div>
  <div class="lat" style="text-align:right">info@{b['domain']}</div>
  <div>{b['addr']}</div>
 </div>
 <div style="position:absolute;left:0;bottom:0;width:{w * .34}px;height:{10 * s}px;background:{b['secondary']}"></div>
</div>'''


def s_card(b, i, T):
    w, h = 680, 440
    dark = b['key'] == 'mirqab'
    body = f'''
<div style="position:absolute;inset:0;{surface(b, TONES[b['key']])}"></div><div class="grain"></div>
<div class="shadow" style="position:absolute;left:300px;top:250px;transform:rotate(-7deg);border-radius:6px">{card_front(b, w, h)}</div>
<div class="shadow" style="position:absolute;left:880px;top:390px;transform:rotate(4deg);border-radius:6px">{card_back(b, w, h)}</div>
<div style="position:absolute;right:110px;top:180px;font-size:19px;color:{'rgba(255,255,255,.6)' if dark else '#6A7176'}">بطاقة العمل · 85 × 55 مم</div>'''
    return page(b, i, T, 'بطاقة العمل', body, cls='dark' if dark else '')


def letter(b, w):
    s = w / 640
    person, role = b['person']
    return f'''<div style="width:{w}px;height:{w * 1.414}px;background:#fff;position:relative;overflow:hidden;padding:{60 * s}px {58 * s}px;font-size:{11.6 * s}px;line-height:2;color:#3A4146">
 <div style="display:flex;justify-content:space-between;align-items:flex-start">
  {emb(logos.horizontal(b, 'color'), h=52 * s)}
  <div style="text-align:left;font-size:{10.5 * s}px;color:#8A8F93;line-height:1.8"><div class="lat">{b['domain']}</div><div class="lat">{b['phone']}</div></div>
 </div>
 <div style="height:{1.5 * s}px;background:{b['secondary']};width:{70 * s}px;margin:{34 * s}px 0 {30 * s}px"></div>
 <div style="display:flex;justify-content:space-between;color:#6A7176;font-size:{11 * s}px"><span>السادة / مجلس الإدارة المحترمين</span><span>التاريخ: 14 نوفمبر 2026م</span></div>
 <div style="margin-top:{18 * s}px">السلام عليكم ورحمة الله وبركاته،</div>
 <div style="margin-top:{8 * s}px;font-weight:700;color:{b['ink']}">الموضوع: عرض خدمات استشارية</div>
 <p style="margin-top:{8 * s}px">يسرّنا في {b['name']} أن نتقدم إليكم بعرضنا لتقديم خدماتنا الاستشارية، استنادًا إلى اجتماعنا الأخير وما ناقشناه من أولويات المرحلة القادمة وأهدافها.</p>
 <p style="margin-top:{8 * s}px">ويتضمن العرض المرفق منهجية العمل، والجدول الزمني لكل مرحلة، وفريق الاستشاريين المكلّف بالمشروع، إضافة إلى مؤشرات قياس الأثر المتفق عليها.</p>
 <p style="margin-top:{8 * s}px">ونتطلع إلى التعاون معكم بما يحقق تطلعاتكم ويعزز أثر قراراتكم.</p>
 <div style="margin-top:{14 * s}px">وتفضلوا بقبول فائق الاحترام والتقدير،</div>
 <div style="margin-top:{22 * s}px;font-weight:700;color:{b['ink']}">{person}</div><div style="color:#8A8F93">{role}</div>
 <div style="position:absolute;bottom:{40 * s}px;right:{58 * s}px;left:{58 * s}px;border-top:1px solid #ECEAE6;padding-top:{12 * s}px;display:flex;justify-content:space-between;font-size:{9.5 * s}px;color:#9A9FA3"><span>{b['addr']}</span><span class="lat">{b['phone']} · info@{b['domain']}</span></div>
 <div style="position:absolute;top:0;left:0;width:{14 * s}px;height:100%;background:{b['primary']}"></div>
</div>'''


def s_letter(b, i, T):
    dark = b['key'] == 'mirqab'
    body = f'''
<div style="position:absolute;inset:0;{surface(b, TONES[b['key']])}"></div><div class="grain"></div>
<div class="shadow" style="position:absolute;left:560px;top:120px;transform:rotate(-2deg)">{letter(b, 600)}</div>
<div class="shadow" style="position:absolute;left:1180px;top:640px;transform:rotate(9deg);border-radius:6px">{card_back(b, 440, 285)}</div>
<div style="position:absolute;left:250px;top:560px;width:300px;height:420px;transform:rotate(-12deg)" class="shadow"><div style="width:100%;height:100%;background:{b['primary']};position:relative;overflow:hidden;display:grid;place-items:center">{emb(logos.symbol(b, 'reverse'), h=110)}<div class="grain" style="opacity:.3"></div></div></div>
<div style="position:absolute;right:110px;top:180px;font-size:19px;color:{'rgba(255,255,255,.6)' if dark else '#6A7176'}">ورق المراسلات الرسمي · A4</div>'''
    return page(b, i, T, 'ورق المراسلات', body, cls='dark' if dark else '')


def profile_cover(b, w):
    h = w * 1.414
    k = b['key']
    slogan = b['web']['h1']
    if k == 'rawasikh':
        art = f'<div style="position:absolute;left:0;right:0;bottom:0;height:{h * .42}px;overflow:hidden">{PATTERNS[k](int(w), int(h * .42), "#fff", b["secondary"], op=.9, s=w / 560)}</div>'
        bg, fg = b['primary'], '#fff'
    elif k == 'madarij':
        art = f'<div style="position:absolute;left:0;top:0;right:0;height:{h * .55}px;overflow:hidden">{PATTERNS[k](int(w), int(h * .55), b["primary"], b["secondary"], op=1, s=w / 600)}</div>'
        bg, fg = b['light'], b['primary']
    else:
        art = f'<div style="position:absolute;inset:0">{PATTERNS[k](int(w), int(h), "#fff", b["secondary"], op=.55, s=w / 520, cx=w * .5, cy=h * .38)}</div>'
        bg, fg = b['primary'], '#fff'
    logo = logos.horizontal(b, 'reverse' if fg == '#fff' else 'color')
    s = w / 560
    pos = f'top:{56 * s}px' if k != 'madarij' else f'bottom:{60 * s}px'
    tpos = f'top:{h * .3}px' if k == 'rawasikh' else (f'top:{h * .6}px' if k == 'madarij' else f'bottom:{h * .14}px')
    return f'''<div style="width:{w}px;height:{h}px;background:{bg};position:relative;overflow:hidden">{art}
 <div style="position:absolute;right:{50 * s}px;{pos}">{emb(logo, h=50 * s)}</div>
 <div style="position:absolute;right:{50 * s}px;left:{50 * s}px;{tpos};color:{fg}">
  <div style="font-size:{16 * s}px;opacity:.7">الملف التعريفي 2026</div>
  <div class="disp" style="font-size:{44 * s}px;font-weight:700;line-height:1.3;margin-top:{8 * s}px">{slogan}</div>
 </div>
 <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.18),rgba(0,0,0,0) 5%,rgba(255,255,255,.08) 6.5%,rgba(0,0,0,0) 9%)"></div>
 <div class="grain" style="opacity:.3"></div>
</div>'''


def profile_back(b, w):
    h = w * 1.414
    k = b['key']
    bg = b['light'] if k == 'madarij' else b['primary']
    mode = 'color' if k == 'madarij' else 'reverse'
    fg = b['ink'] if k == 'madarij' else '#fff'
    return f'''<div style="width:{w}px;height:{h}px;background:{bg};position:relative;overflow:hidden">
 <div style="position:absolute;inset:0;display:grid;place-items:center">{emb(logos.symbol(b, mode), h=w * .26)}</div>
 <div style="position:absolute;bottom:{w * .1}px;left:0;right:0;text-align:center;color:{fg};opacity:.65;font-size:{w * .026}px;line-height:1.9"><div class="lat">{b['domain']}</div><div>{b['addr']}</div></div>
 <div style="position:absolute;inset:0;background:linear-gradient(270deg,rgba(0,0,0,.16),rgba(0,0,0,0) 5%)"></div><div class="grain" style="opacity:.3"></div>
</div>'''


def s_profile(b, i, T):
    dark = b['key'] == 'mirqab'
    body = f'''
<div style="position:absolute;inset:0;{surface(b, TONES[b['key']])}"></div><div class="grain"></div>
<div class="shadow" style="position:absolute;left:300px;top:170px;transform:rotate(-6deg)">{profile_back(b, 520)}</div>
<div class="shadow" style="position:absolute;left:760px;top:120px">{profile_cover(b, 580)}</div>
<div style="position:absolute;right:110px;top:180px;font-size:19px;color:{'rgba(255,255,255,.6)' if dark else '#6A7176'}">غلاف الملف التعريفي · A4</div>'''
    return page(b, i, T, 'الملف التعريفي', body, cls='dark' if dark else '')


def _glass(x, w, h, bottom, lit=False, frame='#1A1F22'):
    """Glass entrance: mullions, double door, diagonal reflections."""
    base = 'linear-gradient(#E2BC82,#A86F33)' if lit else 'linear-gradient(#3A464C,#1C2427)'
    refl = ('repeating-linear-gradient(115deg,rgba(255,255,255,0) 0 120px,rgba(255,255,255,.10) 120px 190px,rgba(255,255,255,0) 190px 330px)')
    mull = ''.join(f'<div style="position:absolute;top:0;bottom:0;left:{x2}px;width:8px;background:{frame}"></div>' for x2 in (0, w * .25, w * .5 - 4, w * .75, w - 8))
    door = f'<div style="position:absolute;bottom:0;left:{w * .5 - 4 - 3}px;width:6px;height:{h * .42}px;background:#9CA3A6"></div><div style="position:absolute;bottom:0;left:{w * .5 + 8}px;width:6px;height:{h * .42}px;background:#9CA3A6"></div>'
    return (f'<div style="position:absolute;left:{x}px;bottom:{bottom}px;width:{w}px;height:{h}px;background:{base};overflow:hidden;border-top:8px solid {frame}">'
            f'<div style="position:absolute;inset:0;background:{refl}"></div>{mull}{door}'
            f'<div style="position:absolute;left:0;right:0;top:{h * .3}px;height:6px;background:{frame}"></div></div>')


def _floor(top_col, bot_col, h=250, joint='rgba(0,0,0,.08)'):
    lines = ''.join(f'<div style="position:absolute;left:0;right:0;top:{y}px;height:1.5px;background:{joint}"></div>' for y in (18, 46, 86, 140, 210))
    return f'<div style="position:absolute;left:0;right:0;bottom:0;height:{h}px;background:linear-gradient({top_col},{bot_col})">{lines}</div>'


def s_sign(b, i, T):
    k = b['key']
    FL = 250            # floor height
    if k == 'rawasikh':      # limestone facade, warm daylight
        wall = ('background:'
                'radial-gradient(1500px 700px at 30% -10%,rgba(255,244,222,.55),transparent 70%),'
                'repeating-linear-gradient(0deg,transparent 0 178px,rgba(90,70,40,.16) 178px 180px),'
                'repeating-linear-gradient(90deg,#DCD1BD 0 318px,rgba(90,70,40,.18) 318px 320px),'
                'linear-gradient(#DED4C2,#CBBEA6)')
        sign = f"""<div style="position:absolute;left:330px;top:170px;width:1260px;height:290px;background:{b['primary']};box-shadow:0 14px 0 #11181B,22px 40px 50px rgba(60,40,20,.38)">
          <div style="position:absolute;inset:0;background:linear-gradient(rgba(255,255,255,.06),transparent 40%)"></div>
          <div style="position:absolute;inset:0;display:grid;place-items:center;filter:drop-shadow(2px 3px 0 #0b1013) drop-shadow(4px 8px 8px rgba(0,0,0,.5))">{emb(logos.horizontal(b, 'reverse'), h=165)}</div></div>"""
        canopy = f'<div style="position:absolute;left:520px;right:520px;bottom:{FL + 300}px;height:26px;background:{b["secondary"]};box-shadow:0 26px 30px rgba(40,30,20,.35)"></div>'
        entr = _glass(560, 800, 300, FL)
        totem = f"""<div style="position:absolute;left:150px;bottom:{FL}px;width:150px;height:560px;background:{b['primary']};box-shadow:12px 0 0 #11181B,30px 30px 50px rgba(40,30,20,.35)">
          <div style="position:absolute;top:60px;left:0;right:0;display:grid;place-items:center">{emb(logos.symbol(b, 'reverse'), h=90)}</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:180px;overflow:hidden;opacity:.9">{PATTERNS[k](150, 180, '#fff', b['secondary'], op=.2, s=.7)}</div></div>"""
        floor = _floor('#B9AB93', '#9C8E76', FL)
        light = ''.join(f'<div style="position:absolute;left:{x}px;top:470px;width:4px;height:24px;background:#3A3A3A"></div><div style="position:absolute;left:{x - 60}px;top:494px;width:124px;height:220px;background:radial-gradient(60px 200px at 50% 0,rgba(255,236,200,.5),transparent 70%)"></div>' for x in (430, 1490))
        body = f'<div style="position:absolute;inset:0;{wall}"></div>{light}{canopy}{entr}{totem}{floor}{sign}'
        cls, txt = '', '#6A6050'
    elif k == 'madarij':     # white modern facade with fins, 3D letters on the wall
        wall = ('background:radial-gradient(1400px 800px at 70% 0,#FFFFFF,transparent 70%),linear-gradient(#F2F3EE,#DFE2D8)')
        fins = ''.join(f'<div style="position:absolute;top:0;bottom:{FL}px;left:{60 + j * 140}px;width:26px;background:linear-gradient(90deg,#CFD4C7,#F1F3EC 60%,#E2E6DB);box-shadow:8px 0 14px rgba(0,0,0,.08)"></div>' for j in range(13) if not (2 < j < 10))
        sign = f"""<div style="position:absolute;left:50%;top:190px;transform:translateX(-50%);filter:drop-shadow(2px 3px 0 #0A3B2E) drop-shadow(12px 20px 14px rgba(0,0,0,.2))">{emb(logos.horizontal(b, 'color'), h=240)}</div>"""
        band = f'<div style="position:absolute;left:470px;right:470px;bottom:{FL + 310}px;height:16px;background:{b["secondary"]}"></div>'
        entr = _glass(500, 920, 310, FL, frame='#203A32')
        plant = lambda x: f'<div style="position:absolute;left:{x}px;bottom:{FL}px;width:150px;height:110px;background:linear-gradient(#3E4A44,#2B342F)"></div><div style="position:absolute;left:{x - 10}px;bottom:{FL + 100}px;width:170px;height:120px;border-radius:50% 50% 30% 30%;background:radial-gradient(circle at 40% 35%,#5E9A54,#2E5E36 70%)"></div>'
        floor = _floor('#CFD2C8', '#B5B9AE', FL)
        body = f'<div style="position:absolute;inset:0;{wall}"></div>{fins}{band}{entr}{plant(300)}{plant(1470)}{floor}{sign}'
        cls, txt = '', '#6A7176'
    else:                    # dark glass curtain wall at night, backlit letters
        wall = ('background:repeating-linear-gradient(0deg,transparent 0 158px,#05071A 158px 162px),'
                'repeating-linear-gradient(90deg,transparent 0 314px,#05071A 314px 320px),'
                'radial-gradient(1200px 600px at 50% 25%,#26305E,transparent 70%),linear-gradient(#141936,#0A0D22)')
        refl = '<div style="position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,0) 0 260px,rgba(140,160,255,.05) 260px 340px,rgba(255,255,255,0) 340px 600px)"></div>'
        sign = f"""<div style="position:absolute;left:50%;top:200px;transform:translateX(-50%);filter:drop-shadow(0 0 14px rgba(255,214,150,.45)) drop-shadow(0 0 46px rgba(242,165,65,.25))">{emb(logos.horizontal(b, 'reverse'), h=230)}</div>
          <div style="position:absolute;left:50%;top:120px;transform:translateX(-50%);width:1200px;height:420px;background:radial-gradient(closest-side,rgba(242,165,65,.10),transparent)"></div>"""
        entr = _glass(560, 800, 300, FL, lit=True, frame='#0B0E20')
        spill = f'<div style="position:absolute;left:360px;right:360px;bottom:0;height:{FL}px;background:radial-gradient(600px 220px at 50% 0,rgba(242,180,100,.45),transparent 75%)"></div>'
        floor = _floor('#141830', '#07091A', FL, joint='rgba(255,255,255,.05)')
        body = f'<div style="position:absolute;inset:0;{wall}"></div>{refl}{entr}{floor}{spill}{sign}'
        cls, txt = 'dark', 'rgba(255,255,255,.6)'
    body += f'<div class="grain" style="opacity:.35"></div><div style="position:absolute;right:110px;bottom:120px;font-size:19px;color:{txt};z-index:6">لوحة واجهة المقر</div>'
    return page(b, i, T, 'لوحة المقر', body, cls=cls)


def site(b, w, h):
    k = b['key']; wb = b['web']
    dark = k == 'mirqab'
    bg = b['primary'] if dark else '#fff'
    fg = '#fff' if dark else b['ink']
    sub = 'rgba(255,255,255,.7)' if dark else '#5A6166'
    logo = logos.horizontal(b, 'reverse' if dark else 'color')
    if k == 'rawasikh':
        art = f'<div style="position:absolute;left:0;top:0;width:{w * .42}px;height:100%;background:{b["primary"]};overflow:hidden"><div style="position:absolute;inset:0;opacity:.95">{PATTERNS[k](int(w * .42), 760, "#fff", b["secondary"], op=.14, s=.9)}</div><div style="position:absolute;inset:0;display:grid;place-items:center">{emb(logos.symbol(b, "reverse"), h=230)}</div></div>'
        tw = w * .5
    elif k == 'madarij':
        art = f'<div style="position:absolute;left:0;top:0;width:{w * .44}px;height:100%;overflow:hidden;background:{b["light"]}">{PATTERNS[k](int(w * .44), 760, b["primary"], b["secondary"], op=1, s=.85)}</div>'
        tw = w * .5
    else:
        art = f'<div style="position:absolute;inset:0">{PATTERNS[k](int(w), 760, "#fff", b["secondary"], op=.5, s=1.2, cx=w * .24, cy=330)}</div>'
        tw = w * .5
    btn_bg = b['secondary'] if k != 'rawasikh' else b['secondary']
    btn_fg = b['ink'] if lum(b['secondary']) > .4 else '#fff'
    return f'''<div style="width:{w}px;height:{h}px;background:{bg};position:relative;overflow:hidden">
 <div style="height:96px;display:flex;align-items:center;padding:0 64px;gap:44px;position:relative;z-index:2;{'' if dark else 'border-bottom:1px solid #EEE;'}background:{bg}">
  {emb(logo, h=50)}
  {''.join(f'<span style="font-size:18px;color:{sub}">{n}</span>' for n in wb['nav'])}
  <span style="margin-inline-start:auto;padding:13px 26px;border:1.5px solid {b['secondary'] if dark else b['primary']};color:{fg};font-size:17px;font-weight:600">English</span>
 </div>
 <div style="position:relative;height:560px">{art}
  <div style="position:absolute;right:64px;top:90px;width:{tw}px;color:{fg}">
   <div style="font-size:19px;color:{b['secondary'] if k != 'madarij' else b['primary']};font-weight:600">{b['name']} {b['tagline']}</div>
   <div class="disp" style="font-size:{60 if k == 'mirqab' else 66}px;font-weight:{300 if k == 'mirqab' else 700};line-height:1.3;margin-top:16px;{'white-space:nowrap' if k == 'mirqab' else ''}">{wb['h1']}</div>
   <p style="font-size:22px;line-height:1.9;color:{sub};margin-top:20px;width:{tw * .9}px">{wb['p']}</p>
   <div style="display:flex;gap:16px;margin-top:34px"><span style="background:{btn_bg};color:{btn_fg};padding:18px 34px;font-size:19px;font-weight:700">{wb['cta']}</span><span style="padding:18px 30px;font-size:19px;border:1.5px solid {'rgba(255,255,255,.3)' if dark else '#D6D8DB'};color:{fg}">تعرّف علينا</span></div>
  </div>
 </div>
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:0 64px;position:relative;z-index:2">
  {''.join(f'<div style="background:{"rgba(255,255,255,.06)" if dark else b["light"]};padding:30px 32px;border-top:3px solid {b["secondary"]}"><div class="disp" style="font-size:25px;font-weight:700;color:{fg}">{t}</div><div style="font-size:18px;color:{sub};margin-top:8px">{d}</div></div>' for t, d in wb['cards'])}
 </div>
 <div style="display:flex;gap:70px;padding:44px 64px;position:relative;z-index:2">
  {''.join(f'<div><div class="lat" style="font-size:44px;font-weight:700;color:{b["secondary"] if dark else b["primary"]};text-align:right">{n}</div><div style="font-size:17px;color:{sub}">{l}</div></div>' for n, l in wb['stats'])}
 </div>
</div>'''


def s_web(b, i, T):
    dark = b['key'] == 'mirqab'
    W, H = 1500, 1000
    sc = .78
    body = f'''
<div style="position:absolute;inset:0;{surface(b, TONES[b['key']])}"></div>
<div class="shadow" style="position:absolute;left:{(1920 - W * sc) / 2}px;top:150px;width:{W * sc}px;border-radius:14px;overflow:hidden;background:#fff">
 <div style="height:44px;background:{'#1C2038' if dark else '#F1F1EE'};display:flex;align-items:center;gap:9px;padding:0 18px;direction:ltr">
  <i style="width:12px;height:12px;border-radius:50%;background:#FF5F57;display:block"></i><i style="width:12px;height:12px;border-radius:50%;background:#FEBC2E;display:block"></i><i style="width:12px;height:12px;border-radius:50%;background:#28C840;display:block"></i>
  <span style="margin-left:24px;height:26px;width:420px;border-radius:7px;background:{'#2A2F4A' if dark else '#fff'};font:14px 'IBM Plex Sans Arabic';color:#8A8F93;display:flex;align-items:center;padding:0 12px">{b['domain']}</span></div>
 <div style="width:{W * sc}px;height:{H * sc - 44}px;overflow:hidden"><div style="transform:scale({sc});transform-origin:top right;width:{W}px;margin-right:0;direction:rtl">{site(b, W, H)}</div></div>
</div>
<div style="position:absolute;right:110px;bottom:56px;font-size:17px;color:{'rgba(255,255,255,.6)' if dark else '#6A7176'};z-index:6"></div>'''
    return page(b, i, T, 'الموقع الإلكتروني', body, cls='dark' if dark else '')


def s_end(b, i, T):
    return (f'<section class="slide dark" style="background:{b["primary"]}">'
            f'<div style="position:absolute;inset:0;display:grid;place-items:center">{emb(logos.symbol(b, "reverse"), h=260)}</div>'
            f'<div style="position:absolute;bottom:120px;left:0;right:0;text-align:center;color:rgba(255,255,255,.6);font-size:19px">{b["name"]} — شركة افتراضية، والهوية عمل استعراضي أصلي لأغراض معرض الأعمال</div></section>')


ORDER = [('cover', None), ('brief', s_brief), ('concept', s_concept), ('construction', s_construction), ('logo', s_primary),
         ('lockups', s_lockups), ('icon', s_icon), ('colors', s_colors), ('typography', s_type), ('pattern', s_pattern),
         ('business-card', s_card), ('letterhead', s_letter), ('company-profile', s_profile), ('signage', s_sign),
         ('website', s_web), ('end', None)]


def build_brand(b):
    T = len(ORDER)
    parts = []
    for idx, (name, fn) in enumerate(ORDER, 1):
        if name == 'cover':
            html = s_cover(b)
        elif name == 'end':
            html = s_end(b, idx, T)
        else:
            html = fn(b, idx, T)
        parts.append(html.replace('<section ', f'<section data-name="{idx:02d}-{name}" ', 1))
    css_vars = (f':root{{--p:{b["primary"]};--s:{b["secondary"]};--l:{b["light"]};--ink:{b["ink"]};'
                f'--disp:{b["css_display"]};--body:{b["css_body"]}}}')
    doc = (f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="fonts.css">'
           f'<style>{css_vars}{CSS}</style></head><body>{"".join(parts)}</body></html>')
    p = os.path.join(HERE, f'{b["key"]}.html')
    open(p, 'w').write(doc)
    return p


def build_portfolio():
    """One showcase document for all three identities."""
    pick = [('concept', s_concept), ('logo', s_primary), ('lockups', s_lockups), ('colors', s_colors), ('pattern', s_pattern),
            ('business-card', s_card), ('letterhead', s_letter), ('company-profile', s_profile), ('signage', s_sign), ('website', s_web)]
    T = 2 + len(BRANDS) * (1 + len(pick)) + 1
    syms = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:26px">{emb(logos.symbol(b, "color"), h=120)}'
                   f'<div style="font-size:18px;color:#8A8F93">{b["num"]} · {b["theme"]}</div></div>' for b in BRANDS)
    cover = f'''<section class="slide" data-name="00-cover" style="background:#FBFAF7">
 <div style="position:absolute;top:64px;right:110px;left:110px;display:flex;justify-content:space-between;font-size:17px;color:#9A9FA3"><span>معرض أعمال — تصميم الهويات البصرية</span><span class="lat">2026</span></div>
 <div style="position:absolute;right:110px;top:190px;width:1500px">
  <div class="lat" style="font-size:20px;color:#9A7B55;font-weight:600;letter-spacing:3px;text-align:right">BRAND IDENTITY PORTFOLIO</div>
  <h1 style="font-family:'Noto Kufi Arabic';font-size:72px;font-weight:700;line-height:1.45;margin-top:18px;color:#14181B">ثلاث هويات بصرية<br>لشركات استشارات سعودية</h1>
  <p style="font-size:23px;line-height:1.9;color:#5A6166;margin-top:22px;width:1000px">هويات أصلية مبنية على فكرة واضحة لكل شركة، تستلهم الثقافة السعودية وقيم رؤية المملكة 2030، وتمتد من الشعار إلى المطبوعات والمنصات الرقمية.</p>
 </div>
 <div style="position:absolute;left:110px;right:110px;bottom:130px;display:flex;justify-content:space-around;border-top:1px solid #E6E4DF;padding-top:56px">{syms}</div>
 <div style="position:absolute;bottom:60px;right:110px;font-size:15px;color:#A7ABAE">جميع الشركات افتراضية، والتصاميم أعمال استعراضية أصلية لا تمثل جهات قائمة.</div>
</section>'''
    cols = ''.join(f'''<div style="border-top:3px solid {b['primary']};padding-top:36px">
   <div style="display:flex;align-items:center;gap:22px;height:96px">{emb(logos.symbol(b, 'color'), h=70)}<div><div class="lat" style="font-size:16px;color:#9A9FA3;text-align:right">{b['num']}</div><div style="font-family:{b['css_display']};font-size:36px;font-weight:700;color:{b['primary']}">{b['name']}</div></div></div>
   <div style="font-size:21px;font-weight:600;margin-top:24px">{b['theme']}</div>
   <div style="font-size:18px;color:#6A7176;margin-top:8px">{b['tagline'].replace('لاستشارات', 'استشارات').replace('للاستشارات', 'استشارات')}</div>
   <p style="font-size:19px;line-height:1.9;color:#5A6166;margin-top:18px">«{b['idea_title']}»</p>
   <div style="margin-top:10px">{''.join(f'<div style="font-size:16.5px;color:#7A8085;line-height:2">— {t}</div>' for t, _ in b['pillars'])}</div>
   <div style="display:flex;gap:8px;margin-top:22px">{''.join(f'<i style="width:44px;height:44px;background:{c};display:block;{"border:1px solid #E6E4DF" if lum(c) > .85 else ""}"></i>' for c, _, _ in b['colors'][:5])}</div>
  </div>''' for b in BRANDS)
    intro = f'''<section class="slide" data-name="01-intro" style="background:#fff">
 <div class="meta" style="color:#9A9FA3"><span><b style="color:#14181B">المنهجية</b></span><span>نظرة عامة</span></div>
 <div style="position:absolute;right:110px;top:200px;width:1300px">
  <div style="font-size:18px;color:#9A7B55;font-weight:600">من الفكرة إلى النظام البصري</div>
  <h1 style="font-family:'Noto Kufi Arabic';font-size:58px;font-weight:700;line-height:1.35;margin-top:16px;color:#14181B">ثلاث شخصيات مختلفة جذريًا</h1>
  <p style="font-size:22px;line-height:1.9;color:#5A6166;margin-top:18px">لكل شركة فكرة واحدة واضحة، تتحول إلى رمز بسيط ونظام كامل من الألوان والخطوط والأنماط والتطبيقات.</p>
 </div>
 <div style="position:absolute;right:110px;left:110px;top:520px;display:grid;grid-template-columns:repeat(3,1fr);gap:70px">{cols}</div>
 <div class="foot" style="color:#9A9FA3"><span>معرض أعمال الهويات البصرية</span><span dir="ltr">02 / {T:02d}</span></div>
</section>'''
    parts = [cover, intro]
    n = 2
    for b in BRANDS:
        n += 1
        css = f'--p:{b["primary"]};--s:{b["secondary"]};--l:{b["light"]};--ink:{b["ink"]};--disp:{b["css_display"]};--body:{b["css_body"]}'
        parts.append(f'<div style="{css}">' + s_cover(b).replace('<section ', f'<section data-name="{n:02d}-{b["key"]}-cover" ', 1))
        for name, fn in pick:
            n += 1
            parts.append(fn(b, n, T).replace('<section ', f'<section data-name="{n:02d}-{b["key"]}-{name}" ', 1))
        parts.append('</div>')
    n += 1
    marks = ''.join(f'<div>{emb(logos.horizontal(b, "color"), h=78)}</div>' for b in BRANDS)
    parts.append(f'''<section class="slide" data-name="{n:02d}-end" style="background:#FBFAF7">
 <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:70px">
  <h1 style="font-family:'Noto Kufi Arabic';font-size:60px;font-weight:700;color:#14181B">بساطة، وقوة، ومعنى</h1>
  <div style="display:flex;gap:110px;align-items:center">{marks}</div>
  <p style="font-size:20px;color:#7A8085;max-width:1000px;text-align:center;line-height:1.9">صُممت هذه الهويات أعمالًا استعراضية أصلية لشركات افتراضية، لتوضيح منهجية بناء هوية بصرية متكاملة تنطلق من فكرة قابلة للشرح والإقناع.</p>
 </div></section>''')
    doc = (f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="fonts.css">'
           f'<style>:root{{--p:#14181B;--s:#9A7B55;--l:#F3F1EC;--ink:#14181B;--disp:"Noto Kufi Arabic";--body:"IBM Plex Sans Arabic"}}{CSS}</style></head><body>{"".join(parts)}</body></html>')
    p = os.path.join(HERE, 'portfolio.html')
    open(p, 'w').write(doc)
    return p


if __name__ == '__main__':
    for b in BRANDS:
        print(build_brand(b))
    print(build_portfolio())
