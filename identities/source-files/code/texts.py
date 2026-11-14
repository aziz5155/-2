# -*- coding: utf-8 -*-
"""Writes the explanation file for each identity and the root README from brands.py."""
import os
from brands import BRANDS

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
for b in BRANDS:
    sec, aud, city = b['persona']
    t = f"""هوية {b['num']}: {b['name']} {b['tagline']}
{'═' * 40}
المحور: {b['theme']}
الطابع: شركة سعودية افتراضية — هوية بصرية استعراضية أصلية لمعرض الأعمال

عنوان العمل في معرض الأعمال:
هوية بصرية متكاملة لشركة استشارات — {b['name']} ({b['theme']})

فكرة الشعار: {b['idea_title']}
{b['idea']}

عناصر الرمز:
""" + '\n'.join(f'• {t1} — {d1}' for t1, d1 in b['pillars']) + f"""

الارتباط بالهوية السعودية ورؤية 2030:
{b['saudi']}

الشخصية: {sec} — الفئة المستهدفة: {aud} — المقر: {city}

لوحة الألوان:
""" + '\n'.join(f'• {n} ({r}): {h}' for h, n, r in b['colors']) + """

الخطوط:
""" + '\n'.join(f'• {f}: {r} — {d}' for f, r, d in b['fonts']) + f"""

محتويات المجلد:
• logo/svg — الشعار الأفقي والرأسي والرمز والكلمة الشعارية، بثلاث نسخ: ملونة ومعكوسة وأحادية (ملفات متجهية، النصوص محوّلة إلى مسارات)
• logo/png — النسخ نفسها بدقة عالية وخلفية شفافة
• mockups — بطاقة العمل، ورق المراسلات، غلاف الملف التعريفي، لوحة المقر، الموقع الإلكتروني، إضافة إلى صفحات الفكرة والألوان والنمط (3840×2160)
• {b['key']}-cover-16x9.png — صورة الغلاف بنسبة 16:9
• {b['key']}-brand-identity.pdf — دليل الهوية الكامل (16 صفحة)
"""
    open(os.path.join(ROOT, b['folder'], 'شرح-الهوية.txt'), 'w').write(t)

open(os.path.join(ROOT, 'README.md'), 'w').write("""# معرض أعمال — ثلاث هويات بصرية لشركات استشارات

| المجلد | الهوية | المحور |
|---|---|---|
""" + ''.join(f"| `{b['folder']}/` | {b['name']} {b['tagline']} | {b['theme']} |\n" for b in BRANDS) + """
- `brand-identity-portfolio.pdf`: معرض أعمال يجمع الهويات الثلاث (36 صفحة).
- كل مجلد هوية فيه: الشعارات (SVG وPNG شفاف)، والتطبيقات، وصورة غلاف 16:9، ودليل الهوية PDF، وملف `شرح-الهوية.txt`.

جميع الشركات افتراضية، والتصاميم أعمال استعراضية أصلية لا تمثل جهات قائمة.

## إعادة البناء
```bash
cd identities/_src && python3 make.py && python3 texts.py
```
يتطلب Python 3 مع `uharfbuzz` (لتحويل النص العربي إلى مسارات)، وNode.js مع Playwright.
""")
print('ok')
