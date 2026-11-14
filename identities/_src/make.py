# -*- coding: utf-8 -*-
"""Full build: logos (SVG + PNG), identity books (PDF), mockups and covers (PNG), portfolio PDF."""
import os, subprocess, glob, shutil
from brands import BRANDS
import logos, slides

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
MOCK = {'11-business-card': 'business-card', '12-letterhead': 'letterhead', '13-company-profile': 'company-profile',
        '14-signage': 'signage', '15-website': 'website', '05-logo': 'logo-presentation', '08-colors': 'color-palette',
        '10-pattern': 'pattern', '03-concept': 'logo-concept'}

def run(*a):
    subprocess.run(a, check=True, cwd=HERE)

logos.build()
tmp = os.path.join(HERE, '_render')
for b in BRANDS:
    d = os.path.join(ROOT, b['folder'])
    svgs = sorted(glob.glob(os.path.join(d, 'logo', 'svg', '*.svg')))
    run('node', 'svg2png.js', os.path.join(d, 'logo', 'png'), '2400', *[s for s in svgs if '-symbol-' not in s])
    run('node', 'svg2png.js', os.path.join(d, 'logo', 'png'), '1600', *[s for s in svgs if '-symbol-' in s])
    html = slides.build_brand(b)
    shots = os.path.join(tmp, b['key'])
    run('node', 'export.js', html, shots, os.path.join(d, f'{b["key"]}-brand-identity.pdf'), '2')
    os.makedirs(os.path.join(d, 'mockups'), exist_ok=True)
    for src, dst in MOCK.items():
        f = glob.glob(os.path.join(shots, src + '*.png'))[0]
        shutil.copy(f, os.path.join(d, 'mockups', dst + '.png'))
    shutil.copy(glob.glob(os.path.join(shots, '01-cover.png'))[0], os.path.join(d, f'{b["key"]}-cover-16x9.png'))
run('node', 'export.js', slides.build_portfolio(), '-', os.path.join(ROOT, 'brand-identity-portfolio.pdf'), '1')
shutil.rmtree(tmp)
print('done')
