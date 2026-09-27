#!/usr/bin/env python3
"""S12 (build 2): one sheet per screen — every tappable thing numbered, and where each tap lands. python3 compose_s12.py dusk|linen [ids…]
Writes shots/s12_out-<theme>/S12_<id>.jpg and shots/S12_crawl_<theme>.pdf."""
import os, json, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); THEME = sys.argv[1] if len(sys.argv) > 1 else 'dusk'
S = os.path.join(HERE, 'shots', 's12crawl-' + THEME); OUT = os.path.join(HERE, 'shots', 's12_out-' + THEME); os.makedirs(OUT, exist_ok=True)
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
C = json.load(open(os.path.join(S, 'crawl.json')))
RED = '#D23A2A'; INK = '#2B2823'; SOFT = '#5C564D'; BG = '#EDE8DE'
def wrap(d, text, font, width):
    out, line = [], ''
    for w in text.split():
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=font) > width and line: out.append(line); line = w
        else: line = t
    if line: out.append(line)
    return out
TITLES = json.loads(open(os.path.join(HERE, 'crawl_titles_s12.json')).read())
only = sys.argv[2:]
pages = []
for sid in [k for k in TITLES if k in C]:
    rec = C[sid]
    if only and sid not in only: continue
    sw = 420; sc = sw / 390
    base = Image.open(os.path.join(S, sid + '.png')).convert('RGB').resize((sw, int(844 * sc)), Image.LANCZOS)
    d0 = ImageDraw.Draw(base, 'RGBA')
    for b in rec['buttons']:
        x, y = b['x'] * sc, b['y'] * sc
        d0.rectangle([x, y, x + b['w'] * sc, y + b['h'] * sc], outline=(210, 58, 42, 200), width=2)
        cx, cy = x + 12, y + 12
        d0.ellipse([cx - 13, cy - 13, cx + 13, cy + 13], fill=RED, outline='white', width=2)
        t = str(b['n']); f = F(14, True); d0.text((cx - d0.textlength(t, font=f) / 2, cy - 9), t, fill='white', font=f)
    tw = 200; th = int(844 * tw / 390); cols = 6
    n = len(rec['buttons']); rows = max(1, (n + cols - 1) // cols)
    W = 40 + sw + 40 + cols * (tw + 16) + 24; cellh = th + 74
    H = max(140 + base.height + 30, 140 + rows * cellh + 20)
    pg = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(pg)
    d.text((40, 24), f"{TITLES.get(sid, sid)}  ·  {THEME.capitalize()}", fill=INK, font=F(34, True)); d.text((40, 72), rec['here'] + f"  ·  {n} things to tap", fill=SOFT, font=F(20))
    pg.paste(base, (40, 120)); d.rectangle([39, 119, 40 + sw, 120 + base.height], outline='#B9B1A3', width=2)
    x0 = 40 + sw + 40
    for k, b in enumerate(rec['buttons']):
        cx = x0 + (k % cols) * (tw + 16); cy = 120 + (k // cols) * cellh
        f = os.path.join(S, f"{sid}__{b['n']}.png")
        lab = f"{b['n']}. {b['text']}" + (' (disabled)' if b['dis'] else '')
        for j, l in enumerate(wrap(d, lab, F(14, True), tw)[:2]): d.text((cx, cy + j * 17), l, fill=RED if b['dis'] else INK, font=F(14, True))
        dest = ('→ ' + (b['dest'] or 'nothing happened: ' + b['err'])) if b['dest'] or b['err'] else '→ ?'
        for j, l in enumerate(wrap(d, dest, F(12), tw)[:2]): d.text((cx, cy + 36 + j * 15), l, fill=SOFT, font=F(12))
        if os.path.exists(f):
            im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS); pg.paste(im, (cx, cy + 70)); d.rectangle([cx - 1, cy + 69, cx + tw, cy + 70 + th], outline='#B9B1A3', width=1)
    pg.save(os.path.join(OUT, f'S12_{sid}.jpg'), quality=80); pages.append(pg)
    print(sid, pg.size)
order = list(TITLES.keys())
if pages and not only:
    ims = [Image.open(os.path.join(OUT, f'S12_{k}.jpg')).convert('RGB') for k in order if os.path.exists(os.path.join(OUT, f'S12_{k}.jpg'))]
    sc = [im.resize((1600, int(im.height * 1600 / im.width))) for im in ims]
    sc[0].save(os.path.join(HERE, 'shots', f'S12_crawl_{THEME}.pdf'), save_all=True, append_images=sc[1:], resolution=110)
    print('pdf', len(sc))
