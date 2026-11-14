# -*- coding: utf-8 -*-
"""Short concept deck: 3 logo concepts, 2 pages each + cover (7 pages). No company data of any kind."""
import os
from brands import BRANDS
import logos
from patterns import PATTERNS
from slides import emb, lum, hexrgb, card_front

HERE = os.path.dirname(os.path.abspath(__file__))
DISCLAIMER = 'نماذج تصميمية مفاهيمية أُعدّت لأغراض استعراض المهارات، ولا تمثل شركات أو جهات قائمة.'
NAMES_NOTE = 'الأسماء مفاهيمية مؤقتة، وغير مخصصة للاستخدام التجاري قبل التحقق من توفرها.'

C = {
 'rawasikh': dict(
   theme='الثقة والرسوخ', fit='الاستشارات الاستراتيجية',
   idea=('الرمز مستوحى من الجدار الطيني في العمارة النجدية: قاعدة أعرض من القمة تمنحه الثبات. '
         'ثلاث طبقات ترمز إلى المعرفة المتراكمة، وأثقلها القاعدة بلون الطين الدافئ. ويخترق الطبقة العليا مثلث '
         'مأخوذ من فتحات التهوية في الجدران النجدية، رمزًا للبصيرة داخل البنية الصلبة.'),
   culture=('تستلهم الفكرة العمارة النجدية التقليدية كما تظهر في البلدات النجدية القديمة، حيث تُبنى الجدران بالطين وتستدق نحو '
            'الأعلى وتتخللها فتحات مثلثة. ولربط الاسم بالرمز، استُبدلت نقطة حرف «خ» بمثلث من الشكل نفسه.'),
   colors=[0, 1, 2, 3]),
 'madarij': dict(
   theme='النمو والتحول', fit='استشارات الأعمال والتطوير',
   idea=('في الخط العربي تُقاس الحروف بالنقطة المعيّنة التي يتركها سنّ القلم. من هذه الوحدة بُني الرمز: ثلاث درجات من '
         'النقاط ترتفع من اليمين إلى اليسار في اتجاه القراءة العربية، وتعلوها نقطة خضراء تمثل الخطوة التالية: '
         'نمو مدروس، كل خطوة فيه محسوبة.'),
   culture=('يرتكز الرمز على تقليد الخط العربي، أحد أعمق عناصر الثقافة في المملكة والعالم العربي، ويستعير منه مبدأ '
            'القياس الدقيق بالنقطة. ولربط الاسم بالرمز، رُسمت نقطة حرف «ج» على هيئة المعيّن نفسه.'),
   colors=[0, 1, 2, 3]),
 'mirqab': dict(
   theme='الرؤية والابتكار', fit='الاستشراف والابتكار',
   idea=('«المرقاب» مكان مرتفع يصعده المستكشف في الصحراء ليرى أبعد مما يراه غيره. والرمز عين على هيئة عدسة، في مركزها '
         'نجم رباعي يستلهم نجم «سهيل». ويخترق النجم إطار العين من الأعلى والأسفل، تعبيرًا عن رؤية تتجاوز الأطر المألوفة.'),
   culture=('اهتدى أهل الجزيرة العربية قديمًا بالنجوم في أسفارهم ومواسمهم، ويرتبط طلوع سهيل في الموروث الشعبي ببداية '
            'انكسار الحر. ولربط الاسم بالرمز، رُسمت نقطة حرف «ب» على هيئة النجم نفسه.'),
   colors=[0, 1, 2, 3]),
}

CSS = """
@page{size:1920px 1080px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;background:#fff}
body{font-family:'IBM Plex Sans Arabic',sans-serif;color:#15191C;direction:rtl;-webkit-font-smoothing:antialiased}
.pg{width:1920px;height:1080px;position:relative;overflow:hidden;page-break-after:always;background:#fff}
.pg:last-child{page-break-after:auto}
.top{position:absolute;top:60px;right:110px;left:110px;display:flex;justify-content:space-between;font-size:17px;color:#8E9398}
.top b{color:#15191C;font-weight:600}
.bot{position:absolute;bottom:52px;right:110px;left:110px;display:flex;justify-content:space-between;font-size:15px;color:#A2A6AA}
.lat{font-family:'IBM Plex Sans Arabic';direction:ltr;unicode-bidi:isolate}
.lbl{font-size:17px;font-weight:600;letter-spacing:.3px;display:flex;align-items:center;gap:12px}
.lbl::before{content:'';width:32px;height:2px;background:currentColor}
p.txt{font-size:23px;line-height:2;color:#454C51}
.shadow{box-shadow:0 1px 1px rgba(0,0,0,.06),0 6px 12px rgba(0,0,0,.08),0 22px 44px rgba(0,0,0,.14),0 50px 90px rgba(0,0,0,.12)}
.grain{position:absolute;inset:0;background:url(noise.png);opacity:.5;mix-blend-mode:multiply;pointer-events:none}
"""


def frame(i, T, left=''):
    return (f'<div class="bot"><span>{DISCLAIMER}</span><span class="lat" dir="ltr">{i:02d} / {T:02d}</span></div>')


def cover(T):
    syms = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:24px">{emb(logos.symbol(b, "color"), h=130)}'
                   f'<div style="font-size:19px;color:#6E757A">{C[b["key"]]["theme"]}</div></div>' for b in BRANDS)
    return f'''<section class="pg" data-name="01-cover" style="background:#FBFAF7">
 <div class="top"><span>نماذج شعارات مفاهيمية</span><span class="lat">2026</span></div>
 <div style="position:absolute;right:110px;top:190px;width:1400px">
  <div class="lbl" style="color:#9A7B55">ثلاثة نماذج · ثلاث أفكار</div>
  <h1 style="font-family:'Noto Kufi Arabic';font-size:74px;font-weight:700;line-height:1.45;margin-top:22px">شعارات بسيطة بمعنى<br>مستوحى من الثقافة السعودية</h1>
  <p class="txt" style="margin-top:20px;width:1050px">لكل نموذج فكرة واحدة واضحة مأخوذة من الموروث: العمارة النجدية، والخط العربي، والاهتداء بالنجوم، تتحول إلى رمز يظل واضحًا من اللوحة الكبيرة حتى الأيقونة الصغيرة.</p>
 </div>
 <div style="position:absolute;left:110px;right:110px;bottom:170px;display:flex;justify-content:space-around;border-top:1px solid #E6E4DF;padding-top:56px">{syms}</div>
 <div style="position:absolute;bottom:56px;right:110px;left:110px;font-size:16px;color:#7E8489;line-height:1.9">{DISCLAIMER}<br>{NAMES_NOTE}</div>
</section>'''


def page_logo(b, n, i, T):
    c = C[b['key']]
    pillars = ''.join(f'<div style="padding:18px 0;border-top:1px solid #E8E6E1;display:flex;gap:18px;align-items:baseline">'
                      f'<b style="font-size:21px;min-width:190px;color:{b["primary"]}">{t}</b><span style="font-size:19px;color:#5E656A">{d}</span></div>'
                      for t, d in b['pillars'])
    return f'''<section class="pg" data-name="{i:02d}-{b['key']}-logo">
 <div class="top"><span><b>النموذج {n}</b> · {c['theme']}</span><span>الشعار والفكرة</span></div>
 <div style="position:absolute;left:0;top:0;bottom:0;width:860px;background:{b['light']};display:grid;place-items:center">{emb(logos.vertical(b, 'color'), h=500)}</div>
 <div style="position:absolute;right:110px;top:170px;width:820px">
  <div class="lbl" style="color:{b['secondary'] if b['key'] != 'madarij' else b['primary']}">فكرة الشعار</div>
  <h1 style="font-family:{b['css_display']};font-size:56px;font-weight:700;line-height:1.35;margin-top:16px">{b['idea_title']}</h1>
  <div style="font-size:18px;color:#8E9398;margin-top:10px">«{b['name']}» اسم مفاهيمي مؤقت · فكرة مناسبة لمجال {c['fit']}</div>
  <p class="txt" style="margin-top:22px">{c['idea']}</p>
  <div style="margin-top:28px">{pillars}</div>
 </div>
 {frame(i, T)}
</section>'''


def card_plain(b, w, h):
    return (f'<div style="width:{w}px;height:{h}px;background:#fff;position:relative;overflow:hidden;border-radius:6px;display:grid;place-items:center">'
            f'{emb(logos.horizontal(b, "color"), h=h * .27)}<div style="position:absolute;left:0;right:0;bottom:0;height:{h * .025}px;background:{b["secondary"]}"></div></div>')


def page_system(b, n, i, T):
    c = C[b['key']]
    tone = {'rawasikh': ('#E9E3D8', '#CFC6B6'), 'madarij': ('#ECEDE6', '#D3D6CB'), 'mirqab': ('#2A2F4A', '#14182E')}[b['key']]
    sw = ''
    for k in c['colors']:
        hx, nm, role = b['colors'][k]
        nm = {'طين الدرعية': 'طين نجدي'}.get(nm, nm)
        r, g, bb = hexrgb(hx)
        fg = '#fff' if lum(hx) < .4 else b['ink']
        bd = 'border:1px solid #E6E4DF;' if lum(hx) > .85 else ''
        sw += (f'<div style="flex:1;height:200px;background:{hx};{bd}color:{fg};padding:20px 20px;display:flex;flex-direction:column;justify-content:space-between">'
               f'<div style="font-size:19px;font-weight:600">{nm}</div><div class="lat" style="font-size:17px;text-align:right;line-height:1.6"><b>{hx}</b><br><span style="opacity:.7">RGB {r} {g} {bb}</span></div></div>')
    sizes = ''.join(f'<div style="text-align:center">{emb(logos.symbol(b, "color"), h=s)}<div class="lat" style="font-size:13px;color:#A2A6AA;margin-top:10px">{s}px</div></div>' for s in (64, 32, 16))
    mock = f'''<div style="position:absolute;left:0;top:0;bottom:0;width:980px;background:radial-gradient(1000px 800px at 45% 35%,{tone[0]},{tone[1]} 75%);overflow:hidden">
   <div class="grain"></div>
   <div class="shadow" style="position:absolute;left:110px;top:190px;transform:rotate(-7deg);border-radius:6px">{card_front(b, 520, 336)}</div>
   <div class="shadow" style="position:absolute;left:420px;top:560px;transform:rotate(5deg);border-radius:6px">{card_plain(b, 520, 336)}</div>
   <div style="position:absolute;right:60px;bottom:110px;font-size:17px;color:{'rgba(255,255,255,.6)' if b['key'] == 'mirqab' else '#6E6A60'}">تطبيق بصري: بطاقتان بالرمز والشعار</div>
  </div>'''
    return f'''<section class="pg" data-name="{i:02d}-{b['key']}-system">
 <div class="top" style="left:1040px"><span><b>النموذج {n}</b> · {c['theme']}</span></div>
 {mock}
 <div style="position:absolute;right:110px;top:170px;width:760px">
  <div class="lbl" style="color:{b['secondary'] if b['key'] != 'madarij' else b['primary']}">العلاقة بالثقافة السعودية</div>
  <p class="txt" style="margin-top:20px">{c['culture']}</p>
  <div class="lbl" style="color:{b['secondary'] if b['key'] != 'madarij' else b['primary']};margin-top:44px">الألوان الأساسية</div>
  <div style="display:flex;gap:12px;margin-top:20px">{sw}</div>
  <div style="display:flex;align-items:flex-end;gap:44px;margin-top:44px"><div style="font-size:18px;color:#6E757A;white-space:nowrap">يبقى الرمز واضحًا حتى في المقاسات الصغيرة</div>{sizes}</div>
 </div>
 {frame(i, T)}
</section>'''


def build():
    T = 1 + 2 * len(BRANDS)
    parts = [cover(T)]
    i = 1
    for n, b in enumerate(BRANDS, 1):
        i += 1; parts.append(page_logo(b, f'{n:02d}', i, T))
        i += 1; parts.append(page_system(b, f'{n:02d}', i, T))
    doc = (f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="fonts.css">'
           f'<style>{CSS}</style></head><body>{"".join(parts)}</body></html>')
    p = os.path.join(HERE, 'concepts.html')
    open(p, 'w').write(doc)
    return p


if __name__ == '__main__':
    print(build())
