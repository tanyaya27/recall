#!/usr/bin/env python3
"""S12 walk sheets: build 2's screens in order, with the caption each step was taken with. python3 compose_s12walk.py"""
import os, json, textwrap
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
INK = '#2B2823'; SOFT = '#5C564D'; BG = '#EDE8DE'
def cap(theme):
    return {w['file']: w['caption'] for w in json.load(open(os.path.join(HERE, 'shots', f's12-{theme}', 'walk.json')))}
def sheet(name, title, sub, frames, cols=5):
    tw = 330; th = int(844 * tw / 390); ch = 96
    rows = (len(frames) + cols - 1) // cols
    W = 40 + cols * (tw + 24) + 16; H = 150 + rows * (th + ch + 20)
    pg = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(pg)
    d.text((40, 26), title, fill=INK, font=F(38, True)); d.text((40, 80), sub, fill=SOFT, font=F(21))
    for k, (theme, f, note) in enumerate(frames):
        x = 40 + (k % cols) * (tw + 24); y = 140 + (k // cols) * (th + ch + 20)
        im = Image.open(os.path.join(HERE, 'shots', f's12-{theme}', f + '.png')).convert('RGB').resize((tw, th), Image.LANCZOS)
        pg.paste(im, (x, y)); d.rectangle([x - 1, y - 1, x + tw, y + th], outline='#B9B1A3', width=2)
        lab = (f"{k + 1}. " + (note or cap(theme).get(f + '.png', f))).replace('＋', '+')
        for j, l in enumerate(textwrap.wrap(lab, 34)[:4]): d.text((x, y + th + 8 + j * 21), l, fill=INK if j == 0 else SOFT, font=F(17, j == 0))
    out = os.path.join(HERE, 'shots', name); pg.save(out, quality=82); print(out, pg.size)
sheet('S12_camera.jpg', 'Build 2 · the camera photographs the level you choose', 'Dusk, your theme. Real photos in the viewfinder. White = the thing; amber = level 1; blue = level 2. The shutter ring is always the chosen level\'s colour.',
  [('dusk', 'w1-01', 'Step 1: "Type it instead" is ON the photo now'), ('dusk', 'w2-01', None), ('dusk', 'w2-02', None), ('dusk', 'w2-03', None), ('dusk', 'w2-04', None),
   ('dusk', 'w2-05', None), ('dusk', 'w2-06', 'Tap the chosen spoon: ITS photos only, swipe, Remove this photo'), ('dusk', 'w2-07', None), ('dusk', 'w2-09', 'Tap the tin twice: only the tin\'s photo, outlined amber'), ('dusk', 'w2-10', None),
   ('linen', 'w2-05', 'Same card in Linen: dark glass on every theme'), ('dusk', 'w7-02', 'Look A (Settings): the levels on the photo'), ('linen', 'w10-02', 'Largest text: still fits'), ('dusk', 'w1-02', None), ('dusk', 'w1-03', None)])
sheet('S12_pages.jpg', 'Build 2 · one page per thing · only containers hold things · one way to say where', 'Every tile opens its page. "Move it" / "Put it somewhere" open the same camera. Row 3: your pencil — the cabinet is taken out of it once, when the app opens (you asked, 09-27).',
  [('dusk', 'w3-01', None), ('dusk', 'w3-02', None), ('dusk', 'w3-04', 'Saved: 4 taps from Home; Undo on the toast'), ('dusk', 'w4-01', None), ('dusk', 'w4-02', None),
   ('dusk', 'w4-03', None), ('dusk', 'w4-05', None), ('linen', 'w4-01', 'The same page in Linen'), ('dusk', 'w6-01', 'Not put away: a list of THINGS; each opens its page'), ('dusk', 'w9-01', '••• every place and every box, with search and "New place or box: photograph it"'),
   ('dusk', 'w5-01', 'Your pencil after the repair: holds nothing, so no In it and no Put things in'), ('dusk', 'w5-02', 'The cabinet, from Not put away: No place yet'), ('dusk', 'w5-03', 'Put it somewhere → ••• (never the cabinet itself, never the pencil)'), ('dusk', 'w5-04', 'Typed "Study": saved'), ('linen', 'w5-01', 'The pencil in Linen')])
