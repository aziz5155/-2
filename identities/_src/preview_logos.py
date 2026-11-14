import glob, sys
rows = ''
for k in ['01-rawasikh', '02-madarij', '03-mirqab']:
    g = lambda kind, mode: open(glob.glob(f'../{k}/logo/svg/*-{kind}-{mode}.svg')[0]).read()
    st = lambda s, h: s.replace('<svg ', f'<svg style="height:{h}px;width:auto" ', 1)
    rows += (f'<div style="display:flex;gap:56px;align-items:center;padding:28px;border-bottom:1px solid #eee">{st(g("horizontal","color"),120)}{st(g("vertical","color"),190)}'
             f'<div style="background:#222;padding:22px">{st(g("horizontal","reverse"),64)}</div>{st(g("symbol","color"),32)}{st(g("symbol","color"),16)}</div>')
open(sys.argv[1], 'w').write('<body style="margin:0;background:#fff">' + rows + '</body>')
