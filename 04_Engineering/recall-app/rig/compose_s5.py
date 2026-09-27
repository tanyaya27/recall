#!/usr/bin/env python3
"""Compose S5 (containers as a graph) into two JPEG pages."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(HERE, 'shots', 's5'); OUT = os.path.join(HERE, 'shots', 's5_out'); os.makedirs(OUT, exist_ok=True)
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
PAGES = {
 'S5_home_inside': ('Home follows the box you tap (Ravi 09-25)',
   'Your chain: baseball card → wooden box → memorabilia box → crawl space. A box is one tile with a count; tap it and Home shows what is in it. Two ways to show where you are: A (Back + the box as a banner) or B (a trail you can tap along).',
   [('h0_top', 'Home: the box is one tile'), ('ha1_memo', 'A · tap it: its things'), ('ha2_wood', 'A · one level deeper'), ('hb1_wood', 'B · the same, with a trail'),
    ('hb2_crawl', 'B · a fixed place opens too'), ('h3_promote', 'Hold → Show on Home too'), ('h4_promoted', 'Promoted: "in the wooden box"'), ('hl_largest', 'A · Largest')],
   ['A: Back steps out one level; the banner (the box\'s photo, where it is) opens the box\'s own card. Quiet, one level at a time.',
    'B: the trail shows every level and any step can be tapped to jump out. More to read; the trail wraps at Largest.',
    'Both: "Log here" logs straight into this box; "Put in" puts things already logged into it (next page).']),
 'S5_put_away': ('Log first, put away later: very fast',
   'Things logged without a place gather under "Not put away". Two ways to put them away, plus an extra for steady hands. One save per batch, with Undo.',
   [('pa1_where', 'P-A · tap the chip: where?'), ('pa2_tap', 'P-A · then tap each thing'), ('pa3_done', 'P-A · saved, Undo'), ('pb1_from_box', 'P-B · from inside the box: Put in'),
    ('pc1_drag', 'P-C · drag onto a box (extra)'), ('pl_largest', 'P-A · Largest')],
   ['P-A (from Home): 1 tap for the chip + 1 for where + 1 per thing + Put = 6 taps for 3 things.',
    'P-B (from the box): "Put in" + 1 per thing + Done = 5 taps for 3 things; best while packing a box.',
    'P-C: fastest for steady hands, hard for shaky ones — an extra, never the only way.']),
}
def page(key):
    title, sub, frames, notes = PAGES[key]
    fw, fh, gap, pad, head, lab = 390, 844, 30, 44, 190, 44
    cols = len(frames); W = pad * 2 + cols * fw + (cols - 1) * gap; H = head + lab + fh + 44 * len(notes) + 60
    pg = Image.new('RGB', (W, H), '#EDE8DE'); d = ImageDraw.Draw(pg)
    d.text((pad, 28), title, fill='#2B2823', font=F(46, True))
    line, y = '', 92
    for w in sub.split():
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=F(24)) > W - 2 * pad: d.text((pad, y), line, fill='#5C564D', font=F(24)); y += 30; line = w
        else: line = t
    d.text((pad, y), line, fill='#5C564D', font=F(24))
    for i, (f, l) in enumerate(frames):
        x = pad + i * (fw + gap)
        d.text((x, head + 4), l, fill='#3A3630', font=F(18, True))
        im = Image.open(os.path.join(S, f's5_{f}.png')).convert('RGB').resize((fw, fh), Image.LANCZOS)
        pg.paste(im, (x, head + lab)); d.rectangle([x - 1, head + lab - 1, x + fw, head + lab + fh], outline='#B9B1A3', width=2)
    y = head + lab + fh + 24
    for t in notes: d.text((pad, y), '•  ' + t, fill='#2B2823', font=F(24, True)); y += 44
    pg.save(os.path.join(OUT, key + '.jpg'), quality=85, optimize=True)
for k in PAGES: page(k)
print(sorted(os.listdir(OUT)))
